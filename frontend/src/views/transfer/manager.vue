<template>
    <div class="iam-transfer-manager-wrapper" :style="{ minHeight: isLoading ? '328px' : 0 }"
        v-bkloading="{ isLoading, opacity: 1 }">
        <template v-if="!isLoading && !isEmpty">
            <div class="transfer-manager-content" ref="transferManagerContent">
                <div class="header" @click="handleRateExpanded">
                    <Icon bk class="expanded-icon" :type="rateExpanded ? 'down-shape' : 'right-shape'" />
                    <label class="title">{{$t(`m.permTransfer['管理员交接']`)}}</label>
                </div>
                <div class="content" v-if="rateExpanded">
                    <div class="slot-content">
                        <bk-table
                            :style="{ maxHeight: managerShowAll ? 'none' : '254px' }"
                            border
                            :data="managerList"
                            size="small"
                            :class="{ 'set-border': tableLoading }"
                            v-bkloading="{ isLoading: tableLoading, opacity: 1 }"
                            :header-cell-class-name="getCellClass"
                            :cell-class-name="getCellClass"
                            @select="handleSelect"
                            @select-all="handleSelectAll">
                            <bk-table-column type="selection" align="center">
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.permTransfer['管理员名称']`)" width="300">
                                <template slot-scope="{ row }">
                                    {{row.name}}
                                </template>
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.common['类型']`)" width="300">
                                <template slot-scope="{ row }">
                                    <template v-if="row.type === 'super_manager'">
                                        {{$t(`m.myApproval['超级管理员']`)}}
                                    </template>
                                    <template v-else-if="row.type === 'system_manager'">
                                        {{$t(`m.nav['系统管理员']`)}}
                                    </template>
                                    <template v-else-if="row.type === 'rating_manager'">
                                        {{$t(`m.userGroup['分级管理员']`)}}
                                    </template>
                                    <template v-else>--</template>
                                </template>
                            </bk-table-column>
                            <bk-table-column :label="$t(`m.common['描述']`)" width="300">
                                <template slot-scope="{ row }">
                                    {{row.description || '--'}}
                                </template>
                            </bk-table-column>
                        </bk-table>
                    </div>
                    <p class="expand-action" @click="handleManagerShowAll" v-if="managerList.length > 5">
                        <Icon :type="managerShowAll ? 'up-angle' : 'down-angle'" />
                        <template v-if="!managerShowAll">{{ $t(`m.common['点击展开']`) }}</template>
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
    export default {
        name: '',
        components: {
        },
        data () {
            return {
                isEmpty: false,
                isLoading: false,
                managerList: [],
                rateExpanded: true,
                managerShowAll: false,
                isSelectAllChecked: false,
                managerSelectData: [],
                pageContainer: null
            };
        },
        mounted () {
            this.pageContainer = document.querySelector('.main-scroller');
            this.fetchData();
        },
        methods: {
            async fetchData () {
                this.isLoading = true;
                try {
                    const res = await this.$store.dispatch('roleList');
                    const managerList = res || [];
                    this.managerList.splice(0, this.managerList.length, ...managerList);

                    this.isEmpty = managerList.length < 1;
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

            handleRateExpanded () {
                this.rateExpanded = !this.rateExpanded;
            },

            handleManagerShowAll () {
                this.managerShowAll = !this.managerShowAll;
                if (!this.managerShowAll) {
                    setTimeout(() => {
                        const top = this.$refs.transferManagerContent.getBoundingClientRect().top
                            + this.pageContainer.scrollTop;

                        this.pageContainer.scrollTo({
                            top: top - 61, // 减去顶导的高度 61
                            behavior: 'smooth'
                        });
                        // this.$refs.transferManagerContent.scrollIntoView({
                        //     behavior: 'smooth'
                        // })
                    }, 10);
                }
            },

            handleSelectAll (selection) {
                this.isSelectAllChecked = !!selection.length;
                if (this.isSelectAllChecked) {
                    this.managerSelectData.splice(
                        0,
                        this.managerSelectData.length,
                        ...this.managerList
                    );
                } else {
                    this.managerSelectData.splice(0, this.managerSelectData.length, ...[]);
                }

                this.$emit('manager-selection-change', this.managerSelectData);
            },

            handleSelect (selection) {
                this.isSelectAllChecked = selection.length === this.managerList.length;
                this.managerSelectData.splice(0, this.managerSelectData.length, ...selection);

                this.$emit('manager-selection-change', this.managerSelectData);
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
    @import './manager.css';
</style>
