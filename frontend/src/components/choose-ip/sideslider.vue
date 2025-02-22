<template>
    <!-- eslint-disable max-len -->
    <bk-sideslider
        :is-show="show"
        :title="curTitle"
        :width="720"
        quick-close
        transfer
        ext-cls="iam-aggregate-resource-sideslider-cls"
        @update:isShow="handleCancel">
        <div slot="content" class="content" v-bkloading="{ isLoading: loading, opacity: 1 }">
            <div class="select-wrapper">
                <div class="left-content">
                    <topology-input
                        :is-filter="isFilter"
                        :placeholder="curPlaceholder"
                        @on-search="handleSearch" />
                    <div class="list-wrapper"
                        v-bkloading="{ isLoading: listLoading, opacity: 1 }"
                        @scroll="handleScroll">
                        <template v-if="!listLoading">
                            <p
                                v-for="item in selectList"
                                :key="item.id"
                                :title="item.id"
                                class="item">
                                <bk-checkbox
                                    :true-value="true"
                                    :false-value="false"
                                    v-model="item.checked"
                                    @change="handleSelected(...arguments, item)">
                                    {{ item.display_name }}
                                </bk-checkbox>
                            </p>
                            <div v-if="isScrollBottom" class="loading-item">
                                <div v-bkloading="{ isLoading: true, size: 'mini' }"></div>
                            </div>
                            <div class="empty-wrapper" v-if="selectList.length < 1 && !listLoading">
                                <iam-svg />
                            </div>
                        </template>
                    </div>
                </div>
                <div class="right-content">
                    <div class="right-header">
                        <span :class="['clear-action', { 'disabled': curSelectedList.length < 1 }]" @click.stop="handleClear">{{ $t(`m.common['清空']`) }}</span>
                    </div>
                    <section class="select-list-wrapper">
                        <p
                            v-for="item in curSelectedList"
                            :key="item.id"
                            class="selected-item">
                            <span class="name" :title="item.id">{{ item.display_name }}</span>
                            <span class="action" @click.stop="handleRemove(item)">{{ $t(`m.common['移除']`) }}</span>
                        </p>
                        <div class="empty-wrapper" v-if="curSelectedList.length < 1">
                            <iam-svg />
                        </div>
                    </section>
                </div>
            </div>
        </div>
        <div slot="footer" style="margin-left: 25px;">
            <bk-button theme="primary" @click="handleSave">{{ $t(`m.common['保存']`) }}</bk-button>
            <bk-button style="margin-left: 10px;" @click="handleCancel">{{ $t(`m.common['取消']`) }}</bk-button>
        </div>
    </bk-sideslider>
</template>
<script>
    import _ from 'lodash';
    import TopologyInput from '@/components/choose-ip/topology-input';
    import { leaveConfirm } from '@/common/leave-confirm';
    export default {
        name: '',
        components: {
            TopologyInput
        },
        props: {
            show: {
                type: Boolean,
                default: false
            },
            value: {
                type: Array,
                default: () => []
            },
            params: {
                type: Object,
                default: () => {
                    return {};
                }
            },
            defaultList: {
                type: Array,
                default: () => []
            }
        },
        data () {
            return {
                pagination: {
                    current: 1,
                    totalPage: 0,
                    limit: 23
                },
                selectList: [],
                curSelectedList: [],
                searchValue: '',
                loading: false,
                isFilter: false,
                listLoading: false,
                isScrollBottom: false,
                curSelectedIds: []
            };
        },
        computed: {
            curPlaceholder () {
                if (this.params.name) {
                    return `${this.$t(`m.common['搜索']`)} ${this.params.name}`;
                }
                return '';
            },
            curTitle () {
                if (this.params.name) {
                    return `${this.$t(`m.common['选择']`)} ${this.params.name}`;
                }
                return '';
            },
            isHasDefaultData () {
                return this.defaultList.length > 0;
            }
        },
        watch: {
            show: {
                handler (value) {
                    if (value) {
                        this.pageChangeAlertMemo = window.changeAlert;
                        window.changeAlert = 'iamSidesider';
                        if (this.isHasDefaultData) {
                            this.setSelectList(this.defaultList);
                        } else {
                            this.fetchData(true);
                        }
                    } else {
                        window.changeAlert = this.pageChangeAlertMemo;
                    }
                },
                immediate: true
            },
            value: {
                handler (value) {
                    this.curSelectedList = _.cloneDeep(value);
                },
                deep: true
            },
            curSelectedList: {
                handler (value) {
                    if (value.length < 1) {
                        this.curSelectedIds = [];
                    } else {
                        this.curSelectedIds = value.map(item => item.id);
                    }
                },
                immediate: true
            }
        },
        created () {
            this.pageChangeAlertMemo = false;
        },
        methods: {
            async fetchData (isLoading = false, listLoading = false) {
                this.loading = isLoading;
                this.listLoading = listLoading;
                const params = {
                    keyword: this.searchValue,
                    limit: this.pagination.limit,
                    offset: this.pagination.limit * (this.pagination.current - 1),
                    ancestors: [],
                    system_id: this.params.system_id,
                    type: this.params.id
                };
                try {
                    const res = await this.$store.dispatch('permApply/getResources', params);
                    this.pagination.totalPage = Math.ceil(res.data.count / this.pagination.limit);
                    this.selectList = res.data.results || [];
                    this.selectList.forEach(item => {
                        item.checked = this.curSelectedIds.includes(item.id);
                    });
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
                    this.listLoading = false;
                }
            },

            async handleScroll (event) {
                if (this.isScrollBottom || this.isHasDefaultData) {
                    return;
                }
                if (event.target.scrollTop + event.target.offsetHeight >= event.target.scrollHeight) {
                    window.changeAlert = true;
                    ++this.pagination.current;
                    if (this.pagination.current <= this.pagination.totalPage) {
                        this.isScrollBottom = true;
                        const params = {
                            keyword: this.searchValue,
                            limit: this.pagination.limit,
                            offset: this.pagination.limit * (this.pagination.current - 1),
                            ancestors: [],
                            system_id: this.params.system_id,
                            type: this.params.id
                        };
                        try {
                            const res = await this.$store.dispatch('permApply/getResources', params);
                            this.pagination.totalPage = Math.ceil(res.data.count / this.pagination.limit)
                            ;(res.data.results || []).forEach(item => {
                                item.checked = this.curSelectedIds.includes(item.id);
                            });
                            this.selectList.push(...res.data.results || []);
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
                            this.isScrollBottom = false;
                            event.target.scrollTo(0, event.target.scrollTop - 1);
                        }
                    }
                } else {
                    this.isScrollBottom = false;
                }
            },

            handleSearch (payload) {
                window.changeAlert = true;
                this.searchValue = payload;
                if (this.isFilter && payload === '') {
                    this.isFilter = false;
                } else {
                    this.isFilter = true;
                }
                this.pagination = Object.assign({}, {
                    current: 1,
                    totalPage: 0,
                    limit: 23
                });
                if (this.isHasDefaultData) {
                    this.setSearchData();
                    return;
                }
                this.fetchData(false, true);
            },

            async setSelectList (payload) {
                const setData = async () => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve(payload);
                        }, 300);
                    });
                };
                this.listLoading = true;
                try {
                    const res = await setData();
                    this.selectList = _.cloneDeep(res);
                    this.selectList.forEach(item => {
                        item.checked = this.curSelectedIds.includes(item.id);
                    });
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
                    this.listLoading = false;
                }
            },

            setSearchData () {
                let templateList = this.defaultList;
                if (this.searchValue !== '') {
                    templateList = this.defaultList.filter(item => item.display_name.indexOf(this.searchValue) > -1);
                }
                this.setSelectList(templateList);
            },

            handleClear () {
                window.changeAlert = true;
                this.curSelectedList = [];
                this.selectList.forEach(item => {
                    item.checked = false;
                });
            },

            handleRemove ({ id }) {
                window.changeAlert = true;
                this.curSelectedList = this.curSelectedList.filter(item => item.id !== id);
                const len = this.selectList.length;
                for (let i = 0; i < len; i++) {
                    if (this.selectList[i].id === id) {
                        this.selectList[i].checked = false;
                        break;
                    }
                }
            },

            handleSelected (value, trueValue, falseValue, payload) {
                window.changeAlert = true;
                if (value) {
                    this.curSelectedList.push({ ...payload });
                } else {
                    this.curSelectedList = this.curSelectedList.filter(item => item.id !== payload.id);
                }
            },

            resetData () {
                this.pagination = Object.assign({}, {
                    current: 1,
                    totalPage: 0,
                    limit: 23
                });
                this.searchValue = '';
                this.curSelectedList = [];
                this.selectList = [];
                this.isScrollBottom = false;
            },

            handleSave () {
                window.changeAlert = false;
                this.$emit('update:show', false);
                this.$emit('on-selected', _.cloneDeep(this.curSelectedList));
                this.resetData();
            },

            handleCancel () {
                let cancelHandler = Promise.resolve();
                if (window.changeAlert) {
                    cancelHandler = leaveConfirm();
                }
                cancelHandler.then(() => {
                    this.$emit('update:show', false);
                    this.resetData();
                }, _ => _);
            }
        }
    };
</script>
<style lang="postcss">
    .iam-aggregate-resource-sideslider-cls {
        .content {
            padding: 20px 25px;
            height: calc(100vh - 114px);
        }
        .select-wrapper {
            height: 480px;
            display: flex;
            justify-self: start;
        }
        .left-content {
            width: 220px;
            border-top: 1px solid #dcdee5;
            border-bottom: 1px solid #dcdee5;
            border-left: 1px solid #dcdee5;
            .list-wrapper {
                position: relative;
                padding: 5px 10px;
                height: calc(100% - 32px);
                overflow: auto;
                /*滚动条整体样式*/
                &::-webkit-scrollbar {
                    width: 6px; /*竖向滚动条的宽度*/
                    height: 6px; /*横向滚动条的高度*/
                }
                /*滚动条里面的小方块*/
                &::-webkit-scrollbar-thumb {
                    background: #dcdee5;
                    border-radius: 3px;
                }
                /*滚动条轨道的样式*/
                &::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 3px;
                }
                .item {
                    line-height: 24px;
                    .bk-checkbox-text {
                        font-size: 12px;
                        max-width: 165px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }
                .loading-item {
                    line-height: 20px;
                }
                .empty-wrapper {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    img {
                        width: 120px;
                    }
                }
            }
        }
        .right-content {
            position: relative;
            width: 450px;
            border: 1px solid #dcdee5;
            .right-header {
                position: relative;
                padding: 0 10px;
                height: 32px;
                line-height: 32px;
                font-size: 14px;
                border-bottom: 1px solid #dcdee5;
                .clear-action {
                    position: absolute;
                    right: 10px;
                    font-size: 12px;
                    color: #3a84ff;
                    cursor: pointer;
                    &:hover {
                        color: #699df4;
                    }
                    &.disabled {
                        color: #c4c6cc;
                        cursor: not-allowed;
                    }
                }
            }
            .select-list-wrapper {
                height: calc(100% - 32px);
                overflow: auto;
                /*滚动条整体样式*/
                &::-webkit-scrollbar {
                    width: 6px; /*竖向滚动条的宽度*/
                    height: 6px; /*横向滚动条的高度*/
                }
                /*滚动条里面的小方块*/
                &::-webkit-scrollbar-thumb {
                    background: #dcdee5;
                    border-radius: 3px;
                }
                /*滚动条轨道的样式*/
                &::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 3px;
                }
            }
            .selected-item {
                padding: 0 10px;
                display: flex;
                justify-content: space-between;
                line-height: 32px;
                font-size: 12px;
                border-bottom: 1px solid #dcdee5;
                .name {
                    max-width: 400px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .action {
                    color: #3a84ff;
                    cursor: pointer;
                    &:hover {
                        color: #699df4;
                    }
                }
            }
            .empty-wrapper {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                img {
                    width: 120px;
                }
            }
        }
        .bk-sideslider-footer {
            background-color: #f5f6fa!important;
            border-color: #dcdee5!important;
        }
    }
</style>
