<template>
    <layout>
        <left-layout
            :data="applyList"
            :active="currentActive"
            :filter-data="filterData"
            :is-loading="isApplyLoading"
            :can-scroll-load="canScrollLoad"
            @on-change="handleChange"
            @on-filter-change="handleFilterChange"
            @on-load="handleLoadMore" />
        <div slot="right">
            <component
                :key="comKey"
                :is="curCom"
                :params="currentApplyData"
                :loading="cancelLoading"
                @on-cancel="handleCancel">
            </component>
        </div>
    </layout>
</template>
<script>
    import Layout from './common/render-page-layout';
    import LeftLayout from './components/left';
    import RenderDetail from './components/apply-detail';
    import RenderGroupDetail from './components/apply-group-detail';
    import RenderRatingManager from './components/apply-create-rate-manager-detail';

    const COM_MAP = new Map([
        [['grant_action', 'renew_action', 'grant_temporary_action'], 'RenderDetail'],
        [['join_group', 'renew_group'], 'RenderGroupDetail'],
        [['create_rating_manager'], 'RenderRatingManager'],
        [['update_rating_manager'], 'RenderRatingManager']
    ]);
    
    export default {
        name: '',
        components: {
            Layout,
            LeftLayout,
            RenderDetail,
            RenderGroupDetail,
            RenderRatingManager
        },
        data () {
            return {
                applyList: [],
                // 默认显示3天内的单据
                currentActive: 3,
                filterData: {
                    3: this.$t(`m.myApply['3天']`),
                    7: this.$t(`m.myApply['一周']`),
                    30: this.$t(`m.myApply['一个月']`),
                    '': this.$t(`m.common['全部']`)
                },
                isLoading: false,
                isApplyLoading: false,
                pagination: {
                    current: 1,
                    totalPage: 1,
                    limit: 15
                },
                currentBackup: 1,
                searchParams: {
                    start_time: '',
                    end_time: ''
                },
                currentApplyData: {},
                cancelLoading: false,
                comKey: -1
            };
        },
        computed: {
            curCom () {
                let com = '';
                for (const [key, value] of this.comMap.entries()) {
                    if (key.includes(this.currentApplyData.type)) { // 根据后台返回值渲染动态组件
                        com = value;
                        break;
                    }
                }
                return com;
            },
            canScrollLoad () {
                return this.pagination.totalPage > this.currentBackup;
            }
        },
        created () {
            this.comMap = COM_MAP;
        },
        methods: {
            async fetchPageData () {
                await this.fetchApplyList();
            },

            async fetchApplyList (isLoading = false, isScrollLoad = false) {
                this.isApplyLoading = isLoading;
                const params = {
                    ...this.searchParams,
                    period: this.currentActive,
                    limit: this.pagination.limit,
                    offset: this.pagination.limit * (this.pagination.current - 1)
                };
                if (!isScrollLoad) {
                    this.applyList.splice(0, this.applyList.length, ...[]);
                }
                try {
                    const res = await this.$store.dispatch('myApply/getApplyList', params);
                    if (!isScrollLoad) {
                        this.applyList = [...res.data.results];
                        if (this.applyList.length < 1) {
                            this.currentApplyData = {};
                        } else {
                            this.currentApplyData = this.applyList[0];
                        }
                        this.pagination.totalPage = Math.ceil(res.data.count / this.pagination.limit);
                    } else {
                        this.currentBackup++;
                        (res.data.results || []).forEach(item => {
                            item.is_read = false;
                        });
                        this.applyList.push(...res.data.results);
                    }
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
                    this.isApplyLoading = false;
                }
            },

            handleLoadMore () {
                this.pagination.current++;
                this.fetchApplyList(false, true);
            },

            handleChange (payload) {
                this.comKey = +new Date();
                this.currentApplyData = payload;
            },

            handleFilterChange (payload) {
                this.currentActive = payload;
                this.pagination.current = 1;
                this.currentBackup = 1;
                this.fetchApplyList(true);
            },

            async handleCancel () {
                this.cancelLoading = true;
                try {
                    await this.$store.dispatch('myApply/applyCancel', { id: this.currentApplyData.id });
                    this.pagination.current = 1;
                    this.currentBackup = 1;
                    this.applyList.splice(0, this.applyList.length, ...[]);
                    await this.fetchApplyList(true);
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
                    this.cancelLoading = false;
                }
            }
        }
    };
</script>
