<template>
    <div class="iam-group-perm-wrapper" v-bkloading="{ isLoading: pageLoading, opacity: 1 }">
        <bk-button
            class="mb20"
            theme="primary" @click="handleBatchAddUserGroup" data-test-id="group_btn_create">
            {{ $t(`m.permTemplate['添加用户组']`) }}
        </bk-button>
        <div class="iam-group-perm-wrapper-list" v-if="!pageLoading">
            <bk-table
                :data="curPageData"
                :size="'small'"
                :pagination="pageConf"
                :ext-cls="tableLoading ? 'is-be-loading' : ''"
                v-bkloading="{ isLoading: tableLoading, opacity: 1 }"
                @page-change="handlePageChange"
                @page-limit-change="pageLimitChange">
                <!-- <bk-table-column label="ID" width="120">
                    <template slot-scope="{ row }">
                        <span :title="`#${row.id}`">{{ '#' + row.id }}</span>
                    </template>
                </bk-table-column> -->
                <bk-table-column :label="$t(`m.userGroup['用户组名']`)">
                    <template slot-scope="{ row }">
                        <span class="user-group-name" :title="row.name" @click="goDetail(row)">{{ row.name }}</span>
                    </template>
                </bk-table-column>
                <bk-table-column :label="$t(`m.common['到期时间']`)" prop="expired_at_display"></bk-table-column>
                <bk-table-column :label="$t(`m.perm['加入用户组的时间']`)">
                    <template slot-scope="{ row }">
                        <span :title="row.created_time">{{ row.created_time.replace(/T/, ' ') }}</span>
                    </template>
                </bk-table-column>
                <bk-table-column :label="$t(`m.common['描述']`)">
                    <template slot-scope="{ row }">
                        <span :title="row.description !== '' ? row.description : ''">
                            {{ row.description !== '' ? row.description : '--'}}
                        </span>
                    </template>
                </bk-table-column>
                <bk-table-column :label="$t(`m.perm['加入方式']`)">
                    <template slot-scope="props">
                        <span v-if="props.row.department_id === 0">{{ $t(`m.perm['直接加入']`) }}</span>
                        <span v-else :title="`${$t(`m.perm['通过组织加入']`)}：${props.row.department_name}`">
                            {{ $t(`m.perm['通过组织加入']`) }}：{{ props.row.department_name }}
                        </span>
                    </template>
                </bk-table-column>
                <bk-table-column :label="$t(`m.common['操作']`)" width="200">
                    <template slot-scope="props">
                        <bk-button disabled text v-if="props.row.department_id !== 0">
                            <span :title="$t(`m.perm['通过组织加入的组无法退出']`)">{{ $t(`m.common['退出']`) }}</span>
                        </bk-button>
                        <bk-button v-else theme="primary" text @click="showQuitTemplates(props.row)">
                            {{ $t(`m.common['退出']`) }}
                        </bk-button>
                    </template>
                </bk-table-column>
            </bk-table>
        </div>

        <bk-dialog
            v-model="isShowUserGroupDialog"
            width="1220"
            :show-footer="false"
            header-position="left"
            ext-cls="iam-attach-action-preview-dialog"
            @after-leave="handleAfterEditLeave">
            <div class="attach-action-preview-content-wrapper" v-bkloading="{ isLoading, opacity: 1 }">
                <template v-if="!isLoading">
                    <div class="user-group-table">
                        <div class="serch-wrapper mb20">
                            <iam-search-select
                                @on-change="handleSearch"
                                :data="searchData"
                                :value="searchValue"
                                :placeholder="$t(`m.applyEntrance['超级管理员申请加入用户组搜索提示']`)"
                                :quick-search-method="quickSearchMethod" />
                        </div>
                        <bk-table
                            ref="groupTableRef"
                            :data="tableList"
                            size="small"
                            :class="{ 'set-border': tableLoading }"
                            ext-cls="user-group-table"
                            :pagination="pagination"
                            :cell-attributes="handleCellAttributes"
                            @page-change="pageChange"
                            @page-limit-change="limitChange"
                            @select="handlerChange"
                            @select-all="handlerAllChange"
                            v-bkloading="{ isLoading: tableDialogLoading, opacity: 1 }">
                            <bk-table-column type="selection" align="center"></bk-table-column>
                            <bk-table-column :label="$t(`m.userGroup['用户组名']`)">
                                <template slot-scope="{ row }">
                                    <span class="user-group-name" :title="row.name" @click="handleView(row)">
                                        {{ row.name }}
                                    </span>
                                </template>
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.common['描述']`)">
                                <template slot-scope="{ row }">
                                    <span :title="row.description !== '' ? row.description : ''">
                                        {{ row.description || '--' }}
                                    </span>
                                </template>
                            </bk-table-column>
                        </bk-table>
                    </div>
                    <p class="user-group-error" v-if="isShowGroupError">{{ $t(`m.permApply['请选择用户组']`) }}</p>
                </template>
                <section ref="expiredAtRef" class="mt20">
                    <iam-deadline :value="expiredAt" @on-change="handleDeadlineChange" :cur-role="curRole" />
                    <p class="expired-at-error" v-if="isShowExpiredError">{{ $t(`m.permApply['请选择申请期限']`) }}</p>
                </section>

                <section class="button-warp">
                    <bk-button
                        class="mb20"
                        theme="primary" @click="handleBatchUserGroupSubmit" data-test-id="group_btn_create">
                        {{ $t(`m.common['提交']`) }}
                    </bk-button>
                    <bk-button
                        class="mb20"
                        theme="default" @click="handleBatchUserGroupCancel" data-test-id="group_btn_create">
                        {{ $t(`m.common['取消']`) }}
                    </bk-button>
                </section>
            </div>
        </bk-dialog>

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
    </div>
</template>
<script>
    import { mapGetters } from 'vuex';
    import DeleteDialog from '@/components/iam-confirm-dialog/index.vue';
    import IamSearchSelect from '@/components/iam-search-select';
    import RenderPermSideslider from '../../perm/components/render-group-perm-sideslider';
    import { PERMANENT_TIMESTAMP } from '@/common/constants';
    import IamDeadline from '@/components/iam-deadline/horizontal';

    export default {
        name: '',
        components: {
            IamSearchSelect,
            IamDeadline,
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

                pageLoading: false,
                tableLoading: false,
                isShowUserGroupDialog: false,
                isLoading: false,
                searchValue: [],
                tableList: [],
                tableDialogLoading: false,
                expiredAt: 15552000,
                isShowExpiredError: false,
                expiredAtUse: 15552000,
                currentSelectList: [],
                pagination: {
                    current: 1,
                    count: 0,
                    limit: 10
                }

            };
        },
        computed: {
            ...mapGetters(['user']),
            curSelectIds () {
                return this.currentSelectList.map(item => item.id);
            }
        },
        watch: {
            'pagination.current' (value) {
                this.currentBackup = value;
            }
        },
        async created () {
            await this.fetchPermGroups(false, true);
            this.searchData = [
                {
                    id: 'name',
                    name: this.$t(`m.userGroup['用户组名']`),
                    default: true
                },
                {
                    id: 'description',
                    name: this.$t(`m.common['描述']`),
                    disabled: true
                }
            ];
        },
        methods: {
            /**
             * handleAnimationEnd
             */
            handleAnimationEnd () {
                this.curGroupName = '';
                this.curGroupId = '';
                this.isShowPermSidesilder = false;
            },

            /**
             * fetchPermGroups
             */
            async fetchPermGroups (isTableLoading = false, isPageLoading = false) {
                this.tableLoading = isTableLoading;
                this.pageLoading = isPageLoading;
                const { type } = this.data;
                try {
                    const res = await this.$store.dispatch('perm/getPermGroups', {
                        subjectType: type === 'user' ? type : 'department',
                        subjectId: type === 'user' ? this.data.username : this.data.id
                    });
                    this.dataList.splice(0, this.dataList.length, ...(res.data || []));
                    this.initPageConf();
                    this.curPageData = this.getDataByPage(this.pageConf.current);
                } catch (e) {
                    this.$emit('toggle-loading', false);
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                } finally {
                    this.tableLoading = false;
                    this.pageLoading = false;
                }
            },

            /**
             * initPageConf
             */
            initPageConf () {
                this.pageConf.current = 1;
                const total = this.dataList.length;
                this.pageConf.count = total;
            },

            /**
             * handlePageChange
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
             * pageLimitChange
             */
            pageLimitChange (currentLimit, prevLimit) {
                this.pageConf.limit = currentLimit;
                this.pageConf.current = 1;
                this.handlePageChange(this.pageConf.current);
            },

            /**
             * goDetail
             */
            goDetail (row) {
                this.curGroupName = row.name;
                this.curGroupId = row.id;
                this.isShowPermSidesilder = true;
            },

            /**
             * showQuitTemplates
             */
            showQuitTemplates (row) {
                this.deleteDialogConf.visiable = true;
                this.deleteDialogConf.row = Object.assign({}, row);
                this.deleteDialogConf.msg = `${this.$t(`m.common['退出']`)}【${row.name}】，${this.$t(`m.info['将不再继承该组的权限']`)}。`;
            },

            async confirmDelete () {
                this.deleteDialogConf.loading = true;
                const { type } = this.data;
                try {
                    await this.$store.dispatch('perm/quitGroupTemplates', {
                        subjectType: type === 'user' ? type : 'department',
                        subjectId: type === 'user' ? this.data.username : this.data.id,
                        type: 'group',
                        id: this.deleteDialogConf.row.id
                    });
                    this.cancelDelete();
                    this.messageSuccess(this.$t(`m.info['退出成功']`), 2000);
                    await this.fetchPermGroups(true);
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

            cancelDelete () {
                this.deleteDialogConf.visiable = false;
            },

            afterLeaveDelete () {
                this.deleteDialogConf.row = Object.assign({}, {});
                this.deleteDialogConf.msg = '';
                this.deleteDialogConf.loading = false;
            },

            async handleBatchAddUserGroup () {
                this.isShowUserGroupDialog = true;
                this.searchValue = [];
                this.searchParams = {};
                await this.fetchUserGroupList();
            },

            handleAfterEditLeave () {
                
            },

            handleSearch (payload, result) {
                this.currentSelectList = [];
                this.searchParams = payload;
                this.resetPagination();
                this.fetchUserGroupList(true);
            },

            resetPagination () {
                this.pagination = Object.assign({}, {
                    limit: 10,
                    current: 1,
                    count: 0
                });
            },

            pageChange (page) {
                if (this.currentBackup === page) {
                    return;
                }
                this.pagination.current = page;
                this.currentSelectList = [];
                this.fetchUserGroupList();
            },

            limitChange (currentLimit, prevLimit) {
                this.pagination.limit = currentLimit;
                this.pagination.current = 1;
                this.fetchUserGroupList();
            },

            handleDeadlineChange (payload) {
                if (payload) {
                    this.isShowExpiredError = false;
                }
                if (payload !== PERMANENT_TIMESTAMP && payload) {
                    const nowTimestamp = +new Date() / 1000;
                    const tempArr = String(nowTimestamp).split('');
                    const dotIndex = tempArr.findIndex(item => item === '.');
                    const nowSecond = parseInt(tempArr.splice(0, dotIndex).join(''), 10);
                    this.expiredAtUse = payload + nowSecond;
                    return;
                }
                this.expiredAtUse = payload;
            },

            quickSearchMethod (value) {
                return {
                    name: this.$t(`m.common['关键字']`),
                    id: 'keyword',
                    values: [value]
                };
            },

            // 获取列表数据
            async fetchUserGroupList () {
                this.tableDialogLoading = true;
                const params = {
                    ...this.searchParams,
                    limit: this.pagination.limit,
                    offset: this.pagination.limit * (this.pagination.current - 1)
                };
                try {
                    const res = await this.$store.dispatch('userGroup/getUserGroupList', params);
                    this.pagination.count = res.data.count || 0;
                    this.tableList.splice(0, this.tableList.length, ...(res.data.results || []));
                } catch (e) {
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'primary',
                        message: e.message || e.data.msg || e.statusText
                    });
                } finally {
                    this.tableDialogLoading = false;
                }
            },
            // 选择checkbox
            handlerChange (selection, row) {
                this.currentSelectList = selection;
                this.isShowGroupError = false;
            },

            handleExpiredAt () {
                const nowTimestamp = +new Date() / 1000;
                const tempArr = String(nowTimestamp).split('');
                const dotIndex = tempArr.findIndex(item => item === '.');
                const nowSecond = parseInt(tempArr.splice(0, dotIndex).join(''), 10);
                const expiredAt = this.expiredAtUse + nowSecond;
                return expiredAt;
            },

            // 提交
            async handleBatchUserGroupSubmit () {
                if (this.expiredAtUse === 15552000) {
                    this.expiredAtUse = this.handleExpiredAt();
                }
                const { type, username, id } = this.data;
                const members = [];
                if (type === 'user') {
                    members.push({
                        id: username,
                        type
                    });
                }
                if (type === 'depart') {
                    members.push({
                        id,
                        type: 'department'
                    });
                }
                const params = {
                    members,
                    group_ids: this.curSelectIds,
                    expired_at: this.expiredAtUse
                };
                try {
                    await this.$store.dispatch('userGroup/batchAddUserGroupMember', params);
                    this.isShowUserGroupDialog = false;
                    this.messageSuccess(this.$t(`m.info['添加用户组成功']`), 2000);
                    await this.fetchPermGroups(true);
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
                    this.loading = false;
                }
            },

            handleBatchUserGroupCancel () {
                this.isShowUserGroupDialog = false;
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
    .button-warp{
        margin-top: 30px;
        text-align: center;
    }
    .serch-wrapper{
        width: 500px;
    }
</style>
