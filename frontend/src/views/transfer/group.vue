<template>
    <div class="iam-transfer-group-wrapper" :style="{ minHeight: isLoading ? '328px' : 0 }"
        v-bkloading="{ isLoading, opacity: 1 }">
        <template v-if="!isLoading && !isEmpty">
            <div class="transfer-group-content" ref="transferGroupContent">
                <div class="header" @click="handleGroupExpanded">
                    <Icon bk class="expanded-icon" :type="groupExpanded ? 'down-shape' : 'right-shape'" />
                    <label class="title"> {{$t(`m.permTransfer['用户组权限交接']`)}} </label>
                    <div class="sub-title" v-if="groupNotTransferCount > 0">
                        <i class="iam-icon iamcenter-warning-fill not-transfer-icon"></i>
                        {{$t(`m.permTransfer['无法交接用户组：']`)}}{{groupNotTransferCount}}{{$t(`m.common['个']`)}}
                        <span class="reason">{{$t(`m.permTransfer['（通过组织加入、已过期的组无法交接）']`)}}</span>
                    </div>
                </div>
                <div class="content" v-if="groupExpanded">
                    <div class="slot-content">
                        <bk-table
                            :style="{ maxHeight: groupShowAll ? 'none' : '254px' }"
                            border
                            ref="groupTable"
                            :data="groupList"
                            size="small"
                            :class="{ 'set-border': tableLoading }"
                            v-bkloading="{ isLoading: tableLoading, opacity: 1 }"
                            :header-cell-class-name="getCellClass"
                            :cell-class-name="getCellClass"
                            @select="handleSelect"
                            @select-all="handleSelectAll">
                            <bk-table-column type="selection" align="center" :selectable="row => !row.canNotTransfer">
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.userGroup['用户组名']`)" width="300">
                                <template slot-scope="{ row }">
                                    <span :style="{ color: row.canNotTransfer ? '#c4c6cc' : '' }">
                                        {{row.name}}
                                        <i class="iam-icon iamcenter-warning-fill not-transfer-icon"
                                            v-if="row.canNotTransfer"></i>
                                    </span>
                                </template>
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.approvalProcess['来源']`)" width="300">
                                <template slot-scope="{ row }">
                                    <span :style="{ color: row.canNotTransfer ? '#c4c6cc' : '' }"
                                        :title="row.role && row.role.name ? row.role.name : ''">
                                        {{ row.role ? row.role.name : '--' }}
                                    </span>
                                </template>
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.perm['加入方式']`)" width="350">
                                <template slot-scope="{ row }">
                                    <span :style="{ color: row.canNotTransfer ? '#c4c6cc' : '' }"
                                        v-if="row.department_id === 0">{{ $t(`m.perm['直接加入']`) }}</span>
                                    <span :style="{ color: row.canNotTransfer ? '#c4c6cc' : '' }"
                                        v-else :title="`${$t(`m.perm['通过组织加入']`)}：${row.department_name}`">
                                        {{ $t(`m.perm['通过组织加入']`) }}：{{ row.department_name }}
                                    </span>
                                </template>
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.common['到期时间']`)" width="220">
                                <template slot-scope="{ row }">
                                    <span>{{row.expired_at_display}}</span>
                                </template>
                            </bk-table-column>
                        </bk-table>
                    </div>
                    <p class="expand-action" @click="handleGroupShowAll" v-if="groupList.length > 5">
                        <Icon :type="groupShowAll ? 'up-angle' : 'down-angle'" />
                        <template v-if="!groupShowAll">{{ $t(`m.common['点击展开']`) }}</template>
                        <template v-else>{{ $t(`m.common['点击收起']`) }}</template>
                    </p>
                </div>
            </div>
        </template>
        <!-- <template v-if="!isLoading && isEmpty">
            <div class="empty-wrapper">
                <iam-svg />
                <p class="text">{{ $t(`m.common['暂无数据']`) }}</p>
            </div>
        </template> -->
    </div>
</template>
<script>
    import { mapGetters } from 'vuex';

    export default {
        name: '',
        components: {
        },
        data () {
            return {
                isEmpty: false,
                isLoading: false,
                groupList: [],
                groupExpanded: true,
                groupShowAll: false,
                groupNotTransferCount: 0,
                isSelectAllChecked: false,
                groupSelectData: [],
                pageContainer: null
            };
        },
        computed: {
            ...mapGetters(['user'])
        },
        mounted () {
            this.pageContainer = document.querySelector('.main-scroller');
            this.fetchData();
        },
        methods: {
            async fetchData () {
                this.isLoading = true;
                try {
                    const res = await this.$store.dispatch('perm/getPersonalGroups');
                    const groupList = res.data || [];
                    groupList.forEach(item => {
                        if (String(item.department_id) !== '0' || item.expired_at < this.user.timestamp) {
                            this.groupNotTransferCount += 1;
                            item.canNotTransfer = true;
                        }
                    });

                    this.groupList.splice(0, this.groupList.length, ...groupList);

                    this.isEmpty = groupList.length < 1;
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
                    this.isLoading = false;
                }
            },

            handleGroupExpanded () {
                this.groupExpanded = !this.groupExpanded;
            },

            handleGroupShowAll () {
                this.groupShowAll = !this.groupShowAll;
                if (!this.groupShowAll) {
                    setTimeout(() => {
                        const top = this.$refs.transferGroupContent.getBoundingClientRect().top
                            + this.pageContainer.scrollTop;

                        this.pageContainer.scrollTo({
                            top: top - 61, // 减去顶导的高度 61
                            behavior: 'smooth'
                        });
                        // this.$refs.transferGroupContent.scrollIntoView({
                        //     behavior: 'smooth'
                        // })
                    }, 10);
                }
            },

            handleSelectAll (selection) {
                this.isSelectAllChecked = !!selection.length;
                if (this.isSelectAllChecked) {
                    const validGroupList = this.groupList.filter(item => !item.canNotTransfer);
                    this.groupSelectData.splice(
                        0,
                        this.groupSelectData.length,
                        ...validGroupList
                    );
                } else {
                    this.groupSelectData.splice(0, this.groupSelectData.length, ...[]);
                }

                this.$emit('group-selection-change', this.groupSelectData);
            },

            handleSelect (selection) {
                const validGroupList = this.groupList.filter(item => !item.canNotTransfer);
                this.isSelectAllChecked = selection.length === validGroupList.length;
                this.groupSelectData.splice(0, this.groupSelectData.length, ...selection);
                this.$emit('group-selection-change', this.groupSelectData);
            },

            /**
             * getCellClass
             */
            getCellClass ({ row, column, rowIndex, columnIndex }) {
                if (columnIndex === 0) {
                    return 'checkbox-cell-wrapper';
                }
                return '';
            }
        }
    };
</script>
<style lang="postcss">
    @import './group.css';
</style>
