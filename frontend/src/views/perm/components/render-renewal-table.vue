<template>
    <div class="iam-perm-renewal-table-wrapper" v-bkloading="{ isLoading: loading || isLoading, opacity: 1 }">
        <bk-table
            v-show="!loading"
            :data="tableList"
            size="small"
            ref="permTableRef"
            ext-cls="perm-renewal-table"
            :outer-border="false"
            :header-border="false"
            :pagination="pagination"
            @page-change="pageChange"
            @page-limit-change="limitChange"
            @select="handlerChange"
            @select-all="handlerAllChange">
            <bk-table-column type="selection" align="center" :selectable="getIsSelect"></bk-table-column>
            <template v-for="item in tableProps">
                <bk-table-column
                    v-if="item.prop === 'system'"
                    :filters="systemFilter"
                    :filter-method="systemFilterMethod"
                    :filter-multiple="false"
                    :key="item.prop"
                    :label="item.label"
                    :prop="item.prop">
                    <template slot-scope="{ row }">
                        <span>{{ row.system ? row.system.name || '' : '' }}</span>
                    </template>
                </bk-table-column>
                <bk-table-column
                    v-else-if="item.prop === 'action'"
                    :key="item.prop"
                    :label="item.label"
                    :prop="item.prop">
                    <template slot-scope="{ row }">
                        <span>{{ row.action ? row.action.name || '' : '' }}</span>
                    </template>
                </bk-table-column>
                <bk-table-column
                    v-else
                    :key="item.prop"
                    :label="item.label"
                    :prop="item.prop">
                    <template slot-scope="{ row }">
                        <render-expire-display
                            v-if="item.prop === 'expired_at'"
                            :selected="currentSelectList.map(v => v.id).includes(row.id)"
                            :renewal-time="renewalTime"
                            :cur-time="row.expired_at" />
                        <span v-else>{{ row[item.prop] }}</span>
                    </template>
                </bk-table-column>
            </template>
        </bk-table>
    </div>
</template>
<script>
    import { mapGetters } from 'vuex';
    import renderExpireDisplay from '@/components/render-renewal-dialog/display';
    import { PERMANENT_TIMESTAMP } from '@/common/constants';

    // 过期时间的天数区间
    const EXPIRED_DISTRICT = 15;

    export default {
        name: '',
        components: {
            renderExpireDisplay
        },
        props: {
            type: {
                type: String,
                default: 'group'
            },
            renewalTime: {
                type: Number,
                default: 15552000
            },
            data: {
                type: Array,
                default: () => []
            },
            loading: {
                type: Boolean,
                default: false
            },
            count: {
                type: Number,
                default: () => 0
            }
        },
        data () {
            return {
                tableList: [],
                allData: [],
                currentSelectList: [],
                pagination: {
                    current: 1,
                    count: 0,
                    limit: 10
                },
                currentBackup: 1,
                tableProps: [],
                systemFilter: [],
                isLoading: false
            };
        },
        computed: {
            ...mapGetters(['user'])
        },
        watch: {
            'pagination.current' (value) {
                this.currentBackup = value;
            },
            type: {
                handler (value) {
                    this.tableProps = this.getTableProps(value);
                },
                immediate: true
            },
            currentSelectList: {
                handler (value) {
                    const getTimestamp = payload => {
                        if (this.renewalTime === PERMANENT_TIMESTAMP) {
                            return this.renewalTime;
                        }
                        if (payload < this.user.timestamp) {
                            return this.user.timestamp + this.renewalTime;
                        }
                        return payload + this.renewalTime;
                    };
                    const templateList = value.map(item => {
                        return {
                            ...item,
                            expired_at: getTimestamp(item.expired_at)
                        };
                    });
                    this.$emit('on-select', this.type, templateList);
                },
                immediate: true,
                deep: true
            },
            renewalTime (value) {
                const getTimestamp = payload => {
                    if (value === PERMANENT_TIMESTAMP) {
                        return value;
                    }
                    if (payload < this.user.timestamp) {
                        return this.user.timestamp + value;
                    }
                    return payload + value;
                };
                const templateList = this.currentSelectList.map(item => {
                    return {
                        ...item,
                        expired_at: getTimestamp(item.expired_at)
                    };
                });
                this.$emit('on-select', this.type, templateList);
            },
            data: {
                handler (value) {
                    this.allData = value;
                    const data = this.getCurPageData();
                    this.tableList.splice(0, this.tableList.length, ...data);
                    const getDays = payload => {
                        const dif = payload - this.user.timestamp;
                        if (dif < 1) {
                            return 0;
                        }
                        return Math.ceil(dif / (24 * 3600));
                    };
                    this.currentSelectList = this.tableList.filter(item => getDays(item.expired_at) < EXPIRED_DISTRICT);
                    if (this.type === 'custom') {
                        this.tableList.forEach(item => {
                            if (!this.systemFilter.find(subItem => subItem.value === item.system.id)) {
                                this.systemFilter.push({
                                    text: item.system.name,
                                    value: item.system.id
                                });
                            }
                        });
                    }
                    this.$nextTick(() => {
                        this.tableList.forEach(item => {
                            if (this.currentSelectList.map(_ => _.id).includes(item.id)) {
                                this.$refs.permTableRef && this.$refs.permTableRef.toggleRowSelection(item, true);
                            }
                        });
                    });
                }
            },
            count: {
                handler (value) {
                    this.pagination.count = value;
                }
            }
        },
        methods: {
            getIsSelect () {
                return this.tableList.length > 0;
            },

            getTableProps (payload) {
                if (payload === 'group') {
                    return [
                        { label: this.$t(`m.userGroup['用户组名']`), prop: 'name' },
                        { label: this.$t(`m.common['到期时间']`), prop: 'expired_at' }
                    ];
                }
                return [
                    { label: this.$t(`m.common['操作']`), prop: 'action' },
                    { label: this.$t(`m.common['所属系统']`), prop: 'system' },
                    { label: this.$t(`m.common['到期时间']`), prop: 'expired_at' }
                ];
            },

            systemFilterMethod (value, row, column) {
                const property = column.property;
                return row[property].id === value;
            },

            pageChange (page = 1) {
                this.pagination.current = page;
                this.fetchTableData();
            },

            limitChange (currentLimit, prevLimit) {
                this.pagination.limit = currentLimit;
                this.pagination.current = 1;
                this.pageChange();
            },

            handlerAllChange (selection) {
                this.currentSelectList = [...selection];
            },

            handlerChange (selection, row) {
                this.currentSelectList = [...selection];
            },

            getCurPageData (page = 1) {
                let startIndex = (page - 1) * this.pagination.limit;
                let endIndex = page * this.pagination.limit;
                if (startIndex < 0) {
                    startIndex = 0;
                }
                if (endIndex > this.allData.length) {
                    endIndex = this.allData.length;
                }
                return this.allData.slice(startIndex, endIndex);
            },

            async fetchTableData () {
                this.isLoading = true;
                try {
                    const res = await this.$store.dispatch('renewal/getExpireSoonGroupWithUser', {
                        page_size: this.pagination.limit,
                        page: this.pagination.current
                    });
                    this.tableList = res.data || [];
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
            }

        }
    };
</script>
<style lang="postcss">
    .iam-perm-renewal-table-wrapper {
        min-height: 200px;
        .perm-renewal-table {
            margin-top: 16px;
            border: none;
        }
    }
</style>
