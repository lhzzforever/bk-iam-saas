<template>
    <div class="my-perm-group-perm" v-bkloading="{ isLoading: pageLoading, opacity: 1 }">
        <bk-table
            data-test-id="myPerm_table_group"
            :data="curPageData"
            :size="'small'"
            :pagination="pageConf"
            @page-change="handlePageChange"
            @page-limit-change="handlePageLimitChange">
            <!-- 用户组名 -->
            <bk-table-column :label="$t(`m.userGroup['用户组名']`)">
                <template slot-scope="{ row }">
                    <span class="user-group-name" :title="row.name" @click="goDetail(row)">{{ row.name }}</span>
                </template>
            </bk-table-column>
            <!-- 描述 -->
            <bk-table-column :label="$t(`m.common['描述']`)">
                <template slot-scope="{ row }">
                    <span :title="row.description !== '' ? row.description : ''">
                        {{ row.description !== '' ? row.description : '--'}}
                    </span>
                </template>
            </bk-table-column>
            <!-- 所属分级管理员 -->
            <bk-table-column :label="$t(`m.audit['所属分级管理员']`)">
                <template slot-scope="{ row }">
                    <span :class="row.role && row.role.name ? 'can-view' : ''"
                        :title="row.role && row.role.name ? row.role.name : ''"
                        @click.stop="handleViewDetail(row)">{{ row.role ? row.role.name : '--' }}</span>
                </template>
            </bk-table-column>
            <!-- 加入用户组时间 -->
            <bk-table-column :label="$t(`m.perm['加入用户组的时间']`)">
                <template slot-scope="{ row }">
                    <span :title="row.created_time">{{ row.created_time.replace(/T/, ' ') }}</span>
                </template>
            </bk-table-column>
            <!-- 加入方式 -->
            <bk-table-column :label="$t(`m.perm['加入方式']`)">
                <template slot-scope="props">
                    <span v-if="props.row.department_id === 0">{{ $t(`m.perm['直接加入']`) }}</span>
                    <span v-else :title="`${$t(`m.perm['通过组织加入']`)}：${props.row.department_name}`">
                        {{ $t(`m.perm['通过组织加入']`) }}：{{ props.row.department_name }}
                    </span>
                </template>
            </bk-table-column>
            <!-- 到期时间 -->
            <bk-table-column :label="$t(`m.common['到期时间']`)" prop="expired_at_display"></bk-table-column>
            <!-- 操作 -->
            <bk-table-column :label="$t(`m.common['操作']`)" width="200">
                <template slot-scope="props">
                    <bk-button disabled text v-if="props.row.department_id !== 0">
                        <span :title="$t(`m.perm['通过组织加入的组无法退出']`)">{{ $t(`m.common['退出']`) }}</span>
                    </bk-button>
                    <bk-button v-else class="mr10" theme="primary" text @click="showQuitTemplates(props.row)">
                        {{ $t(`m.common['退出']`) }}
                    </bk-button>
                </template>
            </bk-table-column>
        </bk-table>

        <delete-dialog
            :show.sync="deleteDialogConf.visiable"
            :loading="deleteDialogConf.loading"
            :title="$t(`m.dialog['确认退出']`)"
            :sub-title="deleteDialogConf.msg"
            @on-after-leave="afterLeaveDelete"
            @on-cancel="cancelDelete"
            @on-sumbit="confirmDelete" />

        <render-perm-sideslider
            :show="isShowPermSidesilder"
            :name="curGroupName"
            :group-id="curGroupId"
            @animation-end="handleAnimationEnd" />

        <!-- 分级管理员 成员 侧边弹出框 -->
        <bk-sideslider
            :is-show.sync="isShowGradeSlider"
            :width="640"
            :title="gradeSliderTitle"
            :quick-close="true"
            @animation-end="gradeSliderTitle === ''">
            <div slot="content" class="grade-memebers-content" v-bkloading="{ isLoading: sliderLoading, opacity: 1 }"
                data-test-id="myPerm_sideslider_gradeMemebersContent">
                <template v-if="!sliderLoading">
                    <div v-for="(item, index) in gradeMembers" :key="index" class="member-item">
                        <span class="member-name">
                            {{ item }}
                        </span>
                    </div>
                    <p class="info">{{ $t(`m.info['分级管理员成员提示']`) }}</p>
                </template>
            </div>
        </bk-sideslider>
    </div>
</template>
<script>
    import { mapGetters } from 'vuex';
    import DeleteDialog from '@/components/iam-confirm-dialog/index.vue';
    import RenderPermSideslider from '../../perm/components/render-group-perm-sideslider';

    export default {
        name: '',
        components: {
            DeleteDialog,
            RenderPermSideslider
        },
        props: {
            data: {
                type: Object,
                default: () => {
                    return {};
                }
            }
        },
        data () {
            return {
                dataList: [],
                pageConf: {
                    current: 1,
                    count: 0,
                    limit: 10
                },
                curPageData: [],
                deleteDialogConf: {
                    visiable: false,
                    loading: false,
                    row: {},
                    msg: ''
                },

                isShowPermSidesilder: false,
                curGroupName: '',
                curGroupId: '',
                // 控制侧边弹出层显示
                isShowGradeSlider: false,
                sliderLoading: false,
                gradeSliderTitle: ''
            };
        },
        computed: {
            ...mapGetters(['user'])
        },
        async created () {
            await this.fetchSystems();
        },
        methods: {
            async fetchSystems () {
                this.pageLoading = true;
                const { type } = this.data;
                try {
                    const res = await this.$store.dispatch('perm/getDepartPermGroups', {
                        subjectType: type === 'user' ? type : 'department',
                        subjectId: type === 'user' ? this.data.username : this.data.id
                    });
                    this.dataList = res.data || [];
                    this.pageConf.count = this.dataList.length;
                    this.curPageData = this.getDataByPage(this.pageConf.current);
                } catch (e) {
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                } finally {
                    this.pageLoading = false;
                }
            },

            handleAnimationEnd () {
                this.curGroupName = '';
                this.curGroupId = '';
                this.isShowPermSidesilder = false;
            },

            /**
             * 初始化弹层翻页条
             */
            initPageConf () {
                this.pageConf.current = 1;
                const total = this.dataList.length;
                this.pageConf.count = total;
            },

            /**
             * 翻页回调
             *
             * @param {number} page 当前页
             */
            handlePageChange (page = 1) {
                this.pageConf.current = page;
                const data = this.getDataByPage(page);
                this.curPageData.splice(0, this.curPageData.length, ...data);
            },

            /**
             * 获取当前这一页的数据
             *
             * @param {number} page 当前页
             *
             * @return {Array} 当前页数据
             */
            getDataByPage (page) {
                if (!page) {
                    this.pageConf.current = page = 1;
                }
                let startIndex = (page - 1) * this.pageConf.limit;
                let endIndex = page * this.pageConf.limit;
                if (startIndex < 0) {
                    startIndex = 0;
                }
                if (endIndex > this.dataList.length) {
                    endIndex = this.dataList.length;
                }
                return this.dataList.slice(startIndex, endIndex);
            },

            /**
             * 每页显示多少条变化的回调
             *
             * @param {number} currentLimit 变化后每页多少条的数量
             * @param {number} prevLimit 变化前每页多少条的数量
             */
            handlePageLimitChange (currentLimit, prevLimit) {
                this.pageConf.limit = currentLimit;
                this.pageConf.current = 1;
                this.handlePageChange(this.pageConf.current);
            },

            /**
             * 跳转到 group-perm 详情
             *
             * @param {Object} row 当前行对象
             */
            goDetail (row) {
                this.curGroupName = row.name;
                this.curGroupId = row.id;
                this.isShowPermSidesilder = true;
                // this.$router.push({
                //     name: 'groupPermDetail',
                //     params: Object.assign({}, { id: row.id, name: row.name }, this.$route.params),
                //     query: this.$route.query
                // })
            },

            /**
             * 显示脱离模板弹框
             *
             * @param {Object} row 当前行对象
             */
            showQuitTemplates (row) {
                this.deleteDialogConf.visiable = true;
                this.deleteDialogConf.row = Object.assign({}, row);
                this.deleteDialogConf.msg = `${this.$t(`m.common['退出']`)}【${row.name}】，${this.$t(`m.info['将不再继承该组的权限']`)}。`;
            },

            /**
             * 脱离模板确认函数
             */
            async confirmDelete () {
                this.deleteDialogConf.loading = true;
                try {
                    await this.$store.dispatch('perm/quitGroupPerm', {
                        type: 'group',
                        id: this.deleteDialogConf.row.id
                    });
                    this.cancelDelete();
                    this.messageSuccess(this.$t(`m.info['退出成功']`), 2000);
                    this.$emit('refresh');
                } catch (e) {
                    this.deleteDialogConf.loading = false;
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                }
            },

            /**
             * 脱离模板取消函数
             */
            cancelDelete () {
                this.deleteDialogConf.visiable = false;
            },

            /**
             * 脱离模板 afterLeave 函数
             */
            afterLeaveDelete () {
                this.deleteDialogConf.row = Object.assign({}, {});
                this.deleteDialogConf.msg = '';
                this.deleteDialogConf.loading = false;
            },

            /**
             * 调用接口获取分级管理员各项数据
             */
            async fetchRoles (id) {
                this.sliderLoading = true;
                try {
                    const res = await this.$store.dispatch('role/getGradeMembers', { id });
                    this.gradeMembers = [...res.data];
                } catch (e) {
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                } finally {
                    this.sliderLoading = false;
                }
            },
            /**
            * 点击分级管理员中的项弹出侧边框且显示数据
            */
            handleViewDetail (payload) {
                if (payload.role && payload.role.name) {
                    this.isShowGradeSlider = true;
                    this.gradeSliderTitle = `【${payload.role.name}】${this.$t(`m.grading['分级管理员']`)} ${this.$t(`m.common['成员']`)}`;
                    this.fetchRoles(payload.role.id);
                }
            }
        }
    };
</script>
<style lang="postcss">
    .iam-group-perm-wrapper {
        height: calc(100vh - 204px);
        .iam-perm-ext-cls {
            margin-top: 10px;
        }
        .bk-table {
            border-right: none;
            border-bottom: none;
            &.is-be-loading {
                border-bottom: 1px solid #dfe0e5;
            }
            .user-group-name {
                color: #3a84ff;
                cursor: pointer;
                &:hover {
                    color: #699df4;
                }
            }
        }
    }
</style>
