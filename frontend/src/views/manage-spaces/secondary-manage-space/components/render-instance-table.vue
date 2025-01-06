<template>
  <div class="iam-resource-instance-table-wrapper">
    <div :class="[
           'iam-resource-expand'
         ]"
      @click.stop="handleExpanded">
      <div class="iam-resource-header flex-between">
        <div class="iam-resource-header-left">
          <Icon
            bk
            :type="isExpandTable ? 'down-shape' : 'right-shape'" />
          <span>{{ $t(`m.info['已添加']`) }}</span>
          <span class="number">{{ totalCount }}</span>
          <span>{{ $t(`m.common['个']`) }}{{ $t(`m.perm['操作权限']`) }}</span>
        </div>
        <div class="iam-resource-header-right">
          <bk-button
            text
            type="primary"
            size="small"
            @click.stop="handleClearAll"
          >
            {{ $t(`m.common['清空']`)}}
          </bk-button>
        </div>
      </div>
    </div>

    <template v-if="isExpandTable">
      <bk-table
        :data="tableList"
        :ext-cls="!isEdit ? 'is-detail-view' : ''"
        border
        :cell-class-name="getCellClass"
        :span-method="handleSpanMethod"
        @row-mouse-enter="handleRowMouseEnter"
        @row-mouse-leave="handleRowMouseLeave">
        <!-- eslint-disable max-len -->
        <bk-table-column :resizable="false" :label="$t(`m.common['模板名称']`)" width="180" v-if="isCreateMode">
          <template slot-scope="{ row }">
            <span>{{ !!row.isAggregate ? row.actions[0].detail.name || row.actions[0].displayName : row.displayName }}</span>
          </template>
        </bk-table-column>
        <bk-table-column :resizable="false" :label="$t(`m.common['操作']`)" width="180">
          <template slot-scope="{ row }">
            <div v-if="!!row.isAggregate" style="padding: 10px 0;">
              <span class="action-name" :title="row.name">{{ row.name }}</span>
            </div>
            <div v-else>
              <span class="action-name" :title="row.name">{{ row.name }}</span>
            </div>
          </template>
        </bk-table-column>
        <bk-table-column :resizable="false" :label="$t(`m.common['所属系统']`)" width="180" v-if="isCreateMode">
          <template slot-scope="{ row }">
            <span>{{ !!row.isAggregate ? row.system_name : row.detail.system.name }}</span>
          </template>
        </bk-table-column>
        <bk-table-column :resizable="false" :label="$t(`m.common['资源实例']`)" min-width="450">
          <template slot-scope="{ row, $index }">
            <template v-if="!isEdit">
              <template v-if="!row.isEmpty">
                <div v-for="_ in row.resource_groups" :key="_.id">
                  <p class="related-resource-item"
                    v-for="item in _.related_resource_types"
                    :key="item.type">
                    <render-resource-popover
                      :key="item.type"
                      :data="item.condition"
                      :value="`${item.name}：${item.value}`"
                      :max-width="380"
                      @on-view="handleViewResource(row)" />
                  </p>
                </div>
              </template>
              <template v-else>
                {{ $t(`m.common['无需关联实例']`) }}
              </template>
            </template>
            <template v-else>
              <div class="relation-content-wrapper" v-if="!!row.isAggregate">
                <label class="resource-type-name" v-if="row.aggregateResourceType.length === 1">{{ row.aggregateResourceType[0].name }}</label>
                <div class="bk-button-group tab-button" v-else>
                  <bk-button
                    size="small"
                    v-for="(item, index) in row.aggregateResourceType"
                    :key="item.id"
                    :class="[{ 'is-selected': row.selectedIndex === index }]"
                    @click="selectResourceType(row, index)"
                  >
                    {{item.name}}
                    <template v-if="!row.isNoLimited && formatDisplayResourceTotal(row, item.id) > 0">
                      <span>({{ formatDisplayResourceTotal(row, item.id) }})</span>
                    </template>
                  </bk-button>
                </div>
                <div class="content">
                  <render-condition
                    :ref="`condition_${$index}_aggregateRef`"
                    :value="formatDisplayValue(row)"
                    :is-empty="row.empty"
                    :can-view="false"
                    :can-paste="row.canPaste"
                    :is-error="row.isError"
                    @on-mouseover="handlerAggregateConditionMouseover(row)"
                    @on-mouseleave="handlerAggregateConditionMouseleave(row)"
                    @on-copy="handlerAggregateOnCopy(row, $index)"
                    @on-paste="handlerAggregateOnPaste(row)"
                    @on-batch-paste="handlerAggregateOnBatchPaste(row, $index)"
                    @on-click="showAggregateResourceInstance(row, $index)" />
                  <p class="error-tips" v-if="isShowErrorTips">{{ $t(`m.info['请选择资源实例']`) }}</p>
                </div>
              </div>
              <div class="relation-content-wrapper" v-else>
                <template v-if="!row.isEmpty">
                  <div v-for="(_, groIndex) in row.resource_groups" :key="_.id">
                    <div class="relation-content-item"
                      v-for="(content, contentIndex) in _.related_resource_types"
                      :key="contentIndex">
                      <div class="content-name">
                        {{ content.name }}
                        <template v-if="row.isShowRelatedText && _.id">
                          <div style="display: inline-block; color: #979ba5;">
                            ({{ $t(`m.info['已帮您自动勾选依赖操作需要的实例']`) }})
                          </div>
                        </template>
                      </div>
                      <div class="content">
                        <render-condition
                          :ref="`condition_${$index}_${contentIndex}_ref`"
                          :value="content.value"
                          :is-empty="content.empty"
                          :can-view="row.canView"
                          :params="curCopyParams"
                          :can-paste="content.canPaste"
                          :is-error="content.isError"
                          @on-mouseover="handlerConditionMouseover(content)"
                          @on-mouseleave="handlerConditionMouseleave(content)"
                          @on-view="handlerOnView(row, content, contentIndex, groIndex)"
                          @on-copy="handlerOnCopy(content, $index, contentIndex, row)"
                          @on-paste="handlerOnPaste(...arguments, content, $index, contentIndex)"
                          @on-batch-paste="handlerOnBatchPaste(...arguments, content, $index, contentIndex)"
                          @on-click="showResourceInstance(row, $index, content, contentIndex, groIndex)" />
                        <p class="error-tips" v-if="isShowErrorTips">{{ $t(`m.info['请选择资源实例']`) }}</p>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  {{ $t(`m.common['无需关联实例']`) }}
                </template>
              </div>
              <!-- <div class="remove-icon" @click.stop="handleRemove(row, $index)">
                                <Icon type="close-small" />
                            </div> -->
            </template>
          </template>
        </bk-table-column>
        <bk-table-column :resizable="false" width="50" align="center">
          <template slot-scope="{ row, $index }">
            <div class="relation-content-wrapper">
              <div class="remove-icon" @click.stop="handleRemove(row, $index)">
                <bk-icon
                  type="minus-circle-shape"
                  size="medium"
                  style="color: #C4C6CC;"
                />
              </div>
            </div>
          </template>
        </bk-table-column>
        <template slot="empty">
          <ExceptionEmpty />
        </template>
      </bk-table>
    </template>
        
    <bk-sideslider
      :is-show="isShowResourceInstanceSideslider"
      :title="resourceInstanceSidesliderTitle"
      :width="resourceSliderWidth"
      quick-close
      transfer
      ext-cls="related-instance-slider"
      @update:isShow="handleResourceCancel('mask')">
      <div slot="content" class="slider-content">
        <render-resource
          ref="renderResourceRef"
          :data="condition"
          :cur-selection-condition="curSelectionCondition"
          :original-data="originalCondition"
          :flag="curFlag"
          :selection-mode="curSelectionMode"
          :disabled="curDisabled"
          :params="params"
          :res-index="curResIndex"
          :cur-scope-action="curScopeAction"
          @on-limit-change="handleLimitChange"
          @on-init="handleOnInit" />
      </div>
      <div slot="footer" style="margin-left: 25px;">
        <bk-button theme="primary" :disabled="disabled" :loading="sliderLoading" @click="handleResourceSubmit">
          {{ $t(`m.common['保存']`) }}
        </bk-button>
        <bk-button style="margin-left: 10px;" :disabled="disabled" @click="handleResourceCancel('cancel')">{{ $t(`m.common['取消']`) }}</bk-button>
      </div>
    </bk-sideslider>

    <preview-resource-dialog
      :show="isShowPreviewDialog"
      :title="previewDialogTitle"
      :params="previewResourceParams"
      @on-after-leave="handlePreviewDialogClose" />

    <render-aggregate-sideslider
      ref="aggregateRef"
      :show.sync="isShowAggregateSideSlider"
      :params="aggregateResourceParams"
      :is-super-manager="isSuperManager"
      :value="aggregateValue"
      :attr-value="aggregateAttrValue"
      :default-list="defaultSelectList"
      :default-attr-list="defaultAttrList"
      :is-aggregate-empty-message="isAggregateEmptyMessage"
      @on-selected="handlerSelectAggregateRes"
    />

    <bk-sideslider
      :is-show.sync="isShowSideSlider"
      :title="sideSliderTitle"
      :width="sliderWidth"
      :quick-close="true"
      @animation-end="handleAnimationEnd">
      <div slot="content">
        <component :is="'RenderDetail'" :data="previewData" />
      </div>
    </bk-sideslider>
    <bk-dialog
      ext-cls="comfirmDialog"
      v-model="isShowDeleteDialog"
      :close-icon="showIcon"
      :footer-position="footerPosition"
      @confirm="handleDelete">
      <h3 style="text-align:center">{{ $t(`m.common['是否删除该自定义权限']`) }}</h3>
    </bk-dialog>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { leaveConfirm } from '@/common/leave-confirm';
  import { CUSTOM_PERM_TEMPLATE_ID, PERMANENT_TIMESTAMP } from '@/common/constants';
  import { getGroupByField, getIntersectionByField } from '@/common/util';
  import { cloneDeep, uniqWith, isEqual } from 'lodash';
  import Condition from '@/model/condition';
  import GroupPolicy from '@/model/group-policy';
  import RenderAggregateSideslider from '@/components/choose-ip/sideslider';
  import RenderResource from './render-resource';
  import RenderCondition from './render-condition';
  import PreviewResourceDialog from './preview-resource-dialog';
  import RenderResourcePopover from '@/components/iam-view-resource-popover';
  import RenderDetail from '../common/render-detail';
  // import store from '@/store'
  export default {
    name: 'resource-instance-table',
    provide: function () {
      return {
        getResourceSliderWidth: () => this.resourceSliderWidth
      };
    },
    components: {
      RenderAggregateSideslider,
      RenderResource,
      RenderCondition,
      PreviewResourceDialog,
      RenderResourcePopover,
      RenderDetail
    },
    props: {
      list: {
        type: Array,
        default: () => []
      },
      originalList: {
        type: Array,
        default: () => []
      },
      remoteAction: {
        type: Array,
        default: () => []
      },
      systemId: {
        type: String,
        default: ''
      },
      templateId: {
        type: [String, Number],
        default: ''
      },
      isEdit: {
        type: Boolean,
        default: false
      },
      // create，detail
      mode: {
        type: String,
        default: 'create'
      },
      isCustom: {
        type: Boolean,
        default: false
      },
      // type: action，view
      type: {
        type: String,
        default: 'action'
      },
      groupId: {
        type: [String, Number],
        default: ''
      },
      authorization: {
        type: Object,
        default: () => {
          return {};
        }
      },
      isShowErrorTips: {
        type: Boolean,
        default: false
      },
      isAllExpanded: {
        type: Boolean,
        default: false
      },
      isGroup: {
        type: Boolean,
        default: false
      },
      totalCount: {
        type: Number
      }
    },
    data () {
      return {
        tableList: [],
        isShowResourceInstanceSideslider: false,
        resourceInstanceSidesliderTitle: '',
        // 查询参数
        params: {},
        disabled: false,
        curIndex: -1,
        curResIndex: -1,
        curGroupIndex: -1,
        isShowPreviewDialog: false,
        previewDialogTitle: '',
        previewResourceParams: {},
        curCopyData: ['none'],
        curCopyAttrData: [],
        curCopyType: '',
        curId: '',
        isLoading: false,
        curScopeAction: {},
        isShowAggregateSideSlider: false,
        aggregateResourceParams: {},
        aggregateIndex: -1,
        aggregateValue: [],
        aggregateAttrValue: [],
        // 当前复制的数据形态: normal: 普通; aggregate: 聚合后
        curCopyMode: 'normal',
        curCopyKey: '',
        curAggregateResourceType: {},
        defaultSelectList: [],
        defaultAttrList: [],
        sideSliderTitle: '',
        isShowSideSlider: false,
        previewData: [],
        curCopyParams: {},
        sliderLoading: false,
        isShowDeleteDialog: false,
        showIcon: false,
        footerPosition: 'center',
        newRow: '',
        role: '',
        selectedIndex: 0,
        instanceKey: '',
        curCopyDataId: '',
        curSystemActions: [],
        relatedActionsList: [],
        emptyResourceGroupsList: [],
        isExpandTable: false,
        isAggregateEmptyMessage: false,
        resourceSliderWidth: Math.ceil(window.innerWidth * 0.67 - 7) < 960
          ? 960 : Math.ceil(window.innerWidth * 0.67 - 7)
      };
    },
    computed: {
      ...mapGetters(['user']),
      isSuperManager () {
        return this.user.role.type === 'super_manager';
      },
      sliderWidth () {
        return this.mode === 'detail' ? 960 : 640;
      },
      condition () {
        if (this.curIndex === -1 || this.curResIndex === -1 || this.curGroupIndex === -1) {
          return [];
        }
        const curData = this.tableList[this.curIndex].resource_groups[this.curGroupIndex]
            .related_resource_types[this.curResIndex];
        if (!curData) {
          return [];
        }
        return cloneDeep(curData.condition);
      },
      originalCondition () {
        if (this.curIndex === -1
            || this.curResIndex === -1
            || this.curGroupIndex === -1
            || this.originalList.length < 1
          ) {
          return [];
        }
        const curId = this.tableList[this.curIndex].id;
        const curType = this.tableList[this.curIndex].resource_groups[this.curGroupIndex]
          .related_resource_types[this.curResIndex].type;
        if (!this.originalList.some(item => item.id === curId)) {
          return [];
        }
        const curResTypeData = this.originalList.find(item => item.id === curId);
        if (!curResTypeData.resource_groups[this.curGroupIndex]
            .related_resource_types.some(item => item.type === curType)) {
          return [];
        }
        const curData = (curResTypeData.resource_groups[this.curGroupIndex]
          .related_resource_types || []).find(item => item.type === curType);
        if (!curData) {
          return [];
        }
        return cloneDeep(curData.condition);
      },
      curDisabled () {
        if (this.curIndex === -1 || this.curResIndex === -1 || this.curGroupIndex === -1) {
          return false;
        }
        const curData = this.tableList[this.curIndex].resource_groups[this.curGroupIndex]
          .related_resource_types[this.curResIndex];
        return curData.isDefaultLimit;
      },
      curFlag () {
        if (this.curIndex === -1 || this.curResIndex === -1 || this.curGroupIndex === -1) {
          return 'add';
        }
        const curData = this.tableList[this.curIndex].resource_groups[this.curGroupIndex]
          .related_resource_types[this.curResIndex];
        return curData.flag;
      },
      curSelectionMode () {
        if (this.curIndex === -1 || this.curResIndex === -1 || this.curGroupIndex === -1) {
              return 'all';
        }
        const curData = this.tableList[this.curIndex].resource_groups[this.curGroupIndex]
          .related_resource_types[this.curResIndex];
        return curData.selectionMode;
      },
      isShowView () {
        return (payload) => {
          return !payload.isEmpty;
        };
      },
      isCreateMode () {
        return this.mode === 'create';
      },
      isUserGroupDetail () {
        return this.$route.name === 'userGroupDetail';
      },
      curSelectionCondition () {
        if (this.curIndex === -1) {
            return false;
        }
        const curSelectionCondition = this.tableList[this.curIndex].conditionIds;
        return curSelectionCondition;
      },
      // 处理无限制和聚合后多个tab数据结构不兼容情况
      formatDisplayValue () {
        return (payload) => {
          const { isNoLimited, empty, value, aggregateResourceType, selectedIndex } = payload;
          if (value && aggregateResourceType[selectedIndex]) {
            let displayValue = aggregateResourceType[selectedIndex].displayValue;
            if (isNoLimited || empty) {
              displayValue = value;
            }
            return displayValue;
          }
        };
      },
      formatDisplayResourceTotal () {
        return (payload, resourceId) => {
          let result = 0;
          const { attributesDisplayData, instancesDisplayData } = payload;
          const hasInstance = instancesDisplayData[resourceId] && instancesDisplayData[resourceId].length > 0;
          const hasAttribute = attributesDisplayData[resourceId] && attributesDisplayData[resourceId].length > 0;
          if (hasInstance) {
            result += instancesDisplayData[resourceId].length;
          }
          if (hasAttribute) {
            result += attributesDisplayData[resourceId].length;
          }
          return result;
        };
      }
    },
    watch: {
      list: {
        handler (value) {
          value = uniqWith(value, isEqual); // 去重
          this.isExpandTable = value.length > 0;
          if (this.isAllExpanded) {
            this.tableList.splice(0, this.tableList.length, ...value);
          } else {
            const customData = value.filter(e => e.mode === 'custom');
            const templateData = value.filter(e => e.mode === 'template');
            this.tableList.splice(0, this.tableList.length, ...customData, ...templateData);
          }
        },
        immediate: true
      },
      systemId: {
        handler (value) {
          if (value !== '') {
            this.curCopyType = '';
            this.curCopyData = ['none'];
            this.curCopyAttrData = [];
            this.curIndex = -1;
            this.curResIndex = -1;
            this.curGroupIndex = -1;
            this.aggregateResourceParams = {};
            this.aggregateIndex = -1;
            this.aggregateValue = [];
            this.aggregateAttrValue = [];
            this.curCopyMode = 'normal';
            this.curAggregateResourceType = {};
            this.defaultSelectList = [];
            this.defaultAttrList = [];
          }
        },
        immediate: true
      }
      // tableList: {
      //     handler (newVal, oldVal) {
      //         debugger
      //     },
      //     deep: true
      // }
    },
    mounted () {
      window.addEventListener('resize', (this.formatFormItemWidth));
      this.$once('hook:beforeDestroy', () => {
        window.removeEventListener('resize', this.formatFormItemWidth);
      });
    },
    methods: {
      formatFormItemWidth () {
        this.resourceSliderWidth = Math.ceil(window.innerWidth * 0.67 - 7) < 960
          ? 960 : Math.ceil(window.innerWidth * 0.67 - 7);
      },
      
      handleSpanMethod ({ row, column, rowIndex, columnIndex }) {
        if (this.isCreateMode) {
          if (columnIndex === 0) {
            const rowsCount = this.tableList.filter(item => item.detail.id === row.detail.id).length;
            const firstIndex = this.tableList.findIndex(item => item.detail.id === row.detail.id);
            const endIndex = firstIndex + rowsCount - 1;
            if (rowIndex === firstIndex) {
              return {
                rowspan: rowsCount,
                colspan: 1
              };
            } else {
              if (rowIndex <= endIndex) {
                return {
                  rowspan: 0,
                  colspan: 0
                };
              }
            }
          }
        } else {
          return {
            rowspan: 1,
            colspan: 1
          };
        }
      },
      handlerSelectAggregateRes ({ instances, attributes }) {
        const conditionData = this.$refs.aggregateRef.handleGetValue();
        const { isEmpty, data } = conditionData;
        if (isEmpty) {
          return;
        }
        const isConditionEmpty = data.length === 1 && data[0] === 'none';
        const curInstances = instances.map(item => {
          return {
            id: item.id,
            name: item.display_name
          };
        });
        const curAttributes = attributes.map(item => {
          return {
            id: item.id,
            name: item.name,
            values: item.values,
            selecteds: item.selecteds
          };
        });
        let curAggregateItem = this.tableList[this.aggregateIndex];
        const { selectedIndex, aggregateResourceType, instancesDisplayData, attributesDisplayData } = curAggregateItem;
        this.selectedIndex = selectedIndex;
        // 获取操作聚合后当前资源类型
        const resourceTypeKey = aggregateResourceType[selectedIndex].id;
        curAggregateItem = Object.assign(curAggregateItem, {
          isError: false,
          instances: [],
          attributes: [],
          // 获取操作聚合后当前资源类型实例视图数据
          instancesDisplayData: {
            ...instancesDisplayData,
            [resourceTypeKey]: curInstances
          },
          // 获取操作聚合后当前资源类型属性视图数据
          attributesDisplayData: {
            ...attributesDisplayData,
            [resourceTypeKey]: curAttributes
          }
        });
        Object.keys(curAggregateItem.instancesDisplayData).forEach((key) => {
          curAggregateItem.instances.push(...curAggregateItem.instancesDisplayData[key]);
        });
        Object.keys(curAggregateItem.attributesDisplayData).forEach((key) => {
          curAggregateItem.attributes.push(...curAggregateItem.attributesDisplayData[key]);
        });
        if (isConditionEmpty) {
          curAggregateItem = Object.assign(curAggregateItem, {
            instances: ['none'],
            attributes: [],
            isError: true
          });
        } else {
          // 筛选实例数据
          const curAggregateInstance = data.map((item) => {
            if (item.instances && item.instances.length > 0) {
              return item.instances;
            }
            return [];
          });
          // 筛选属性数据
          const curAggregateAttrs = data.map((item) => {
            if (item.attributes && item.attributes.length > 0) {
              return item.attributes;
            }
            return [];
          });
          curAggregateItem = Object.assign(curAggregateItem, {
            instances: curAggregateInstance.flat(Infinity),
            attributes: curAggregateAttrs.flat(Infinity),
            isError: instances.length < 1 && attributes.length < 1
          });
        }
        this.$emit('on-select', curAggregateItem);
      },
      handleRowMouseEnter (index, event, row) {
        if (this.mode === 'detail' && !this.isEdit && this.isCustom && this.type !== 'view') {
          this.$set(row, 'showDelete', true);
        }
      },
      handleRowMouseLeave (index, event, row) {
        if (this.mode === 'detail' && !this.isEdit && this.isCustom && this.type !== 'view') {
          this.$set(row, 'showDelete', false);
        }
      },
      toHandleDelete (row) {
        this.isShowDeleteDialog = true;
        this.newRow = row;
      },
      handleDelete () {
        this.$emit('on-delete', this.newRow);
      },
      handleRemove (row, payload) {
        window.changeDialog = true;
        if (row.isAggregate) {
          this.$emit('on-aggregate-delete', row.system_id, row.actions, payload);
          return;
        }
        this.$emit('on-delete', row.system_id, row.id, `${row.system_id}&${row.id}`, payload);
      },
      handleExpanded () {
        this.isExpandTable = !this.isExpandTable;
      },
      handleClearAll () {
        this.tableList = [];
        this.isExpandTable = false;
        this.$emit('on-clear-all');
      },
      handleViewResource (payload) {
        this.curId = payload.id;
        const params = [];
        if (payload.resource_groups.length > 0) {
          payload.resource_groups.forEach(groupItem => {
            if (groupItem.related_resource_types.length > 0) {
              groupItem.related_resource_types.forEach(item => {
                const { name, type, condition } = item;
                params.push({
                  name: type,
                  label: this.$t(`m.info['tab操作实例']`, { value: name }),
                  tabType: 'resource',
                  data: condition
                });
              });
            }
          });
        }
        this.previewData = cloneDeep(params);
        this.sideSliderTitle = this.$t(`m.info['操作侧边栏操作的资源实例']`, { value: `${this.$t(`m.common['【']`)}${payload.name}${this.$t(`m.common['】']`)}` });
        this.isShowSideSlider = true;
      },
      handleAnimationEnd () {
        this.sideSliderTitle = '';
        this.previewData = [];
        this.curId = '';
      },
      handlerAggregateConditionMouseover (payload) {
        if (this.curCopyData[0] === 'none' && !this.curCopyAttrData.length) {
          return;
        }
        if (this.curCopyKey === `${payload.aggregateResourceType.system_id}${payload.aggregateResourceType.id}`) {
          payload.canPaste = true;
        }
      },
      getResourceCondition (item) {
        const resourceGroups = item.resource_groups || [];
        const result = resourceGroups.length > 0
          && resourceGroups[0].related_resource_types.length > 0
          && resourceGroups[0].related_resource_types[0].condition;
        return result || [];
      },
      getScopeActionResource (payload, id, systemId) {
        const scopeAction = this.authorization[systemId] || [];
        const actions = scopeAction.filter(item => payload.map(_ => _.id).includes(item.id));
        const conditions = actions.map(item => this.getResourceCondition(item)).filter(_ => _.length > 0);
        if (!conditions.length) {
          return [];
        }
        const instances = actions.map(item => {
          if (this.getResourceCondition(item).length) {
            const curCondition = this.getResourceCondition(item)[0];
            return (curCondition.instances && curCondition.instances.filter(v => v.type === id)) || [];
          }
        });
        const attributes = actions.map(item => {
          if (this.getResourceCondition(item).length) {
            const curCondition = this.getResourceCondition(item)[0];
            return (curCondition.attributes && curCondition.attributes.filter(v => v.type === id)) || [];
          }
        });
        const tempData = [];
        const attrData = [];
        const resources = instances
          .map(item => item[0] && item[0].path)
          .map(item => item && item.map(v => v.map(_ => _.id)))
          .filter(item => item !== undefined);
        let resourceList = instances
          .map(item => item[0] && item[0].path)
          .map(item => item && item.map(v => v.map(({ id, name }) => ({ id, name }))))
          .flat(Infinity);
        resourceList = resourceList.filter(item => item !== undefined);
        resources.forEach(item => {
          item && item.forEach(subItem => {
            const hasIntersectionResource = resources.every((v) =>
              v && v.some(vItem => vItem[0] === subItem[0])
            );
            if (hasIntersectionResource) {
              tempData.push(subItem[0]);
            }
          });
        });
        // 判断属性条件如果存在空数据，则交集为空
        const isExistAttrEmpty = attributes.some((v) => !v.length);
        // 获取属性条件之间交集数据
        attributes.forEach(item => {
          item && item.forEach(v => {
            const curValue = `${v.id}&${v.name}&${v.type}`;
            const hasIntersectionResource = attributes.every((subItem) => {
              return subItem && subItem.some(vItem => `${vItem.id}&${vItem.name}&${vItem.type}` === curValue);
            });
            // 如果外层有交集，再取子集values不相同的数据
            if (hasIntersectionResource) {
              const childValues = v.values && v.values.map((p) => `${p.id}&${p.name}`);
              const childChain = attrData.find(k =>
                `${k.id}&${k.name}&${k.type}&${k.values.map((p) => `${p.id}&${p.name}`).join()}` === `${curValue}&${childValues.join()}`
              );
              if (!childChain) {
                attrData.push(v);
              }
            }
          });
        });
        // 如果instances数量与actions数量不一致，则代表聚合的操作有存在空的资源实例
        const hasActionInstance = instances.filter((v) => v.length > 0);
        if ((hasActionInstance.length !== actions.length) && (isExistAttrEmpty || !attrData.length)) {
          this.isAggregateEmptyMessage = true;
          return [];
        }
        const curResource = [...new Set(tempData)];
        const isEqualInstance = curResource.length > 0;
        let instancesList = [];
        let attributesList = [];
        // 格式化实例数据结构
        if (isEqualInstance) {
          const curResourceList = [];
          resourceList.forEach(item => {
            if (!curResourceList.find(subItem => subItem.id === item.id)) {
              curResourceList.push({
                id: item.id,
                display_name: item.name
              });
            }
          });
          instancesList = curResourceList.filter(item => curResource.includes(item.id));
        }
        // 格式化属性条件数据结构
        if (attrData.length > 0 && !isExistAttrEmpty) {
          // 根据相同父级数据进行分组
          const groupFieldData = getGroupByField(attrData, (item) => `${item.id}&${item.name}&${item.type}`);
          attrData.forEach(item => {
            const curData = `${item.id}&${item.name}&${item.type}`;
            if (groupFieldData[curData]) {
              groupFieldData[curData].forEach((v, i) => {
                const nextNode = groupFieldData[curData][i + 1];
                const nextData = nextNode ? nextNode.values : v.values;
                // 遍历多个子集对象数组取交集
                const results = getIntersectionByField((k) => `${k.id}&${k.name}`, v.values, nextData);
                v.values = [...results || []];
                v.selecteds = v.values.map((k) => k.id);
                if (nextNode) {
                  nextNode.values = [...results || []];
                  nextNode.selecteds = v.values.map((k) => k.id);
                }
              });
              groupFieldData[curData] = uniqWith(groupFieldData[curData], isEqual);
            }
          });
          attributesList = uniqWith(attrData, isEqual);
        }
        // 如果存在实例或者属性则返回格式化后数据
        if (!!instancesList.length || !!attributesList.length) {
          return [{
            instancesList,
            attributesList
          }];
        }
        this.isAggregateEmptyMessage = true;
        return [];
      },
      handlerAggregateConditionMouseleave (payload) {
        payload.canPaste = false;
      },

      handlerAggregateOnCopy (payload, index) {
        this.instanceKey = payload.aggregateResourceType[payload.selectedIndex].id;
        window.changeDialog = true;
        this.curCopyKey = `${payload.aggregateResourceType[payload.selectedIndex].system_id}${payload.aggregateResourceType[payload.selectedIndex].id}`;
        this.curAggregateResourceType = payload.aggregateResourceType[payload.selectedIndex];
        this.curCopyData = cloneDeep(payload.instancesDisplayData[this.instanceKey]);
        this.curCopyAttrData = cloneDeep(payload.attributesDisplayData[this.instanceKey]);
        this.curCopyDataId = payload.aggregationId;
        this.curCopyMode = 'aggregate';
        this.showMessage(this.$t(`m.info['实例复制']`));
        this.$refs[`condition_${index}_aggregateRef`] && this.$refs[`condition_${index}_aggregateRef`].setImmediatelyShow(true);
      },

      handlerAggregateOnPaste (payload) {
        let tempInstances = [];
        let tempAttributes = [];
        if (this.curCopyMode === 'aggregate') {
          tempInstances = this.curCopyData;
          tempAttributes = this.curCopyAttrData;
        } else {
          const hasInstance = this.curCopyData.length > 0 && this.curCopyData[0] !== 'none';
          const hasAttribute = this.curCopyAttrData.length > 0;
          if (hasInstance) {
            const instances = this.curCopyData.map(item => item.instance);
            const instanceData = instances[0][0];
            tempInstances = instanceData.path.map(pathItem => {
              return {
                id: pathItem[0].id,
                name: pathItem[0].name
              };
            });
          }
          if (hasAttribute) {
            const { id } = this.curAggregateResourceType;
            this.curCopyAttrData.forEach(v => {
              const curItem = tempAttributes.find(_ => _.type === id);
              if (curItem) {
                tempAttributes.push(v);
              } else {
                tempAttributes.push({
                  ...v,
                  ...{
                    type: id
                  }
                });
              }
            });
          }
        }
        const isEmpty = !tempInstances.length && !tempAttributes.length;
        if (isEmpty) {
          return;
        }
        payload = Object.assign(
          payload,
          {
            instances: cloneDeep(tempInstances),
            attributes: cloneDeep(tempAttributes),
            isError: false
          }
        );
        this.showMessage(this.$t(`m.info['粘贴成功']`));
      },

      handlerAggregateOnBatchPaste (payload, index) {
        let tempCurData = ['none'];
        let tempArrAggregateData = [];
        let tempAttrAggregateData = [];
        if (this.curCopyMode === 'normal') {
          if (this.curCopyData[0] !== 'none') {
            tempCurData = this.curCopyData.map(item => {
              delete item.id;
              return item;
            });
            const instances = this.curCopyData.map(item => item.instance);
            const instanceData = instances[0][0];
            tempArrAggregateData = instanceData.path.map(pathItem => {
              return {
                id: pathItem[0].id,
                name: pathItem[0].name
              };
            });
          }
        } else {
          tempArrAggregateData = this.curCopyData;
          tempAttrAggregateData = this.curCopyAttrData;
          const instances = (() => {
            const arr = [];
            const { id, name, system_id } = this.curAggregateResourceType;
            this.curCopyData && this.curCopyData.forEach(v => {
              const curItem = arr.find(_ => _.type === id);
              if (curItem) {
                curItem.path.push([{
                  id: v.id,
                  name: v.name,
                  system_id,
                  type: id,
                  type_name: name
                }]);
              } else {
                arr.push({
                  name,
                  type: id,
                  path: [[{
                    id: v.id,
                    name: v.name,
                    system_id,
                    type: id,
                    type_name: name
                  }]]
                });
              }
            });
            return arr;
          })();
          const attributes = (() => {
            const arr = [];
            const { id } = this.curAggregateResourceType;
            this.curCopyAttrData.forEach(v => {
              const curItem = arr.find(_ => _.type === id);
              if (curItem) {
                arr.push(v);
              } else {
                arr.push({
                  ...v,
                  ...{
                    type: id
                  }
                });
              }
            });
            return arr;
          })();
          const isExistData = instances.length > 0 || attributes.length > 0;
          if (isExistData) {
            tempCurData = [new Condition({ instances, attributes }, '', 'add')];
          }
        }
        this.tableList.forEach(item => {
          if (!item.isAggregate) {
            item.resource_groups.forEach(groupItem => {
              groupItem.related_resource_types
                && groupItem.related_resource_types.forEach((subItem, subItemIndex) => {
                  if (`${subItem.system_id}${subItem.type}` === this.curCopyKey) {
                    subItem.condition = cloneDeep(tempCurData);
                    subItem.isError = false;
                    this.$emit('on-resource-select', index, subItemIndex, subItem.condition);
                  }
                });
            });
          } else {
            item.aggregateResourceType.forEach(aggregateResourceItem => {
              const systemId = this.isSuperManager
                ? aggregateResourceItem.system_id : item.system_id;
              if (`${systemId}${aggregateResourceItem.id}` === this.curCopyKey && this.curCopyDataId !== item.aggregationId) {
                item.attributes = cloneDeep(tempAttrAggregateData);
                item.instances = cloneDeep(tempArrAggregateData);
                if (Object.keys(item.instancesDisplayData).length) {
                  item.instancesDisplayData[this.instanceKey] = cloneDeep(tempArrAggregateData);
                  item.instances = this.setInstanceData(item.instancesDisplayData);
                } else {
                  this.setInstancesDisplayData(item);
                }
                // 处理聚合属性
                if (Object.keys(item.attributesDisplayData).length) {
                  item.attributesDisplayData[this.instanceKey] = cloneDeep(tempAttrAggregateData);
                }
              }
            });
            item.isError = false;
            this.$emit('on-select', item);
          }
        });
        payload.isError = false;
        this.curCopyData = ['none'];
        this.curCopyAttrData = [];
        this.$refs[`condition_${index}_aggregateRef`] && this.$refs[`condition_${index}_aggregateRef`].setImmediatelyShow(false);
        this.showMessage(this.$t(`m.info['批量粘贴成功']`));
      },

      // 设置instances
      setInstanceData (data) {
        return Object.keys(data).reduce((p, v) => {
          p.push(...data[v]);
          return p;
        }, []);
      },

      // 设置InstancesDisplayData
      setInstancesDisplayData (data) {
        data.instancesDisplayData = data.instances.reduce((p, v) => {
          if (!p[this.instanceKey]) {
            p[this.instanceKey] = [];
          }
          p[this.instanceKey].push({
            id: v.id,
            name: v.name
          });
          return p;
        }, {});
      },

      // 设置正常粘贴InstancesDisplayData
      setNormalInstancesDisplayData (data, key) {
        data.instancesDisplayData[key] = data.instances.map(e => ({
          id: e.id,
          name: e.name
        }));
      },

      showAggregateResourceInstance (data, index) {
        const aggregateResourceParams = {
          ...data.aggregateResourceType[data.selectedIndex],
          curAggregateSystemId: data.system_id,
          isNoLimited: data.isNoLimited || false,
          actionsId: data.actions.map((item) => item.id)
        };
        const instanceKey = data.aggregateResourceType[data.selectedIndex].id;
        this.selectedIndex = data.selectedIndex;
        this.aggregateIndex = index;
        this.instanceKey = instanceKey;
        if (!data.instancesDisplayData[instanceKey]) data.instancesDisplayData[instanceKey] = [];
        if (!data.attributesDisplayData[instanceKey]) data.attributesDisplayData[instanceKey] = [];
        this.aggregateResourceParams = cloneDeep(aggregateResourceParams);
        this.aggregateValue = cloneDeep(data.instancesDisplayData[instanceKey].map(item => {
          return {
            id: item.id,
            display_name: item.name
          };
        }));
        this.aggregateAttrValue = cloneDeep(data.attributesDisplayData[instanceKey] || []);
        this.isAggregateEmptyMessage = false;
        const results = this.getScopeActionResource(
          data.actions,
          instanceKey,
          data.system_id
        );
        window.changeDialog = results.length > 0;
        this.isShowAggregateSideSlider = true;
        if (!results.length) {
          this.defaultSelectList = [];
          this.defaultAttrList = [];
          return;
        }
        const { attributesList, instancesList } = results[0];
        this.defaultSelectList = [...instancesList];
        this.defaultAttrList = [...attributesList];
      },

      showMessage (payload) {
        this.bkMessageInstance = this.$bkMessage({
          limit: 1,
          theme: 'success',
          message: payload
        });
      },
      getCellClass ({ row, column, rowIndex, columnIndex }) {
        let judgeIndex = columnIndex;
        if (this.isCreateMode) {
          judgeIndex = 3;
        } else {
          judgeIndex = 1;
        }
        if (columnIndex === judgeIndex) {
          return 'iam-perm-table-cell-cls';
        }
        return '';
      },
      handleLimitChange () {
        window.changeDialog = true;
        const curData = this.tableList[this.curIndex].resource_groups[this.curGroupIndex]
          .related_resource_types[this.curResIndex];
        curData.isChange = true;
      },
      handleOnInit (payload) {
        this.disabled = !payload;
      },
      handleRelatedAction (payload) {
        if (payload.length < 1) {
          return;
        }
        let hasScopeData = true;
        let scopeInsList = [];
        let scopeInstanceList = [];
        let scopeAttributeList = [];
        payload.forEach(item => {
          const curIndex = this.tableList.findIndex(sub =>
            sub.id === item.id && item.resource_groups[this.curGroupIndex]
          );
          if (curIndex > -1) {
            const { isTemplate, detail } = this.tableList[curIndex];
            const systemId = this.isCreateMode && detail ? detail.system.id : this.systemId;
            const scopeAction = this.authorization[systemId] || [];
            const curScopeAction = cloneDeep(scopeAction.find((scopeItem) => scopeItem.id === item.id));
            // 如果有授权边界判断授权范围是否包含有关联实例
            if (curScopeAction && curScopeAction.resource_groups) {
              curScopeAction.resource_groups.forEach((curScopeActionItem) => {
                curScopeActionItem.related_resource_types.forEach((related) => {
                  if (related.condition.length) {
                    related.condition.forEach((resource) => {
                      // 获取授权范围内的所有实例、属性数据
                      const { instance, instances, attributes } = resource;
                      const resourceInstance = instance || instances;
                      scopeInstanceList = resourceInstance.map(item => item.path).flat(Infinity) || [];
                      scopeAttributeList = cloneDeep(attributes);
                    });
                  }
                });
              });
              if (scopeInstanceList && scopeInstanceList.length > 0) {
                scopeInsList = scopeInstanceList.map((scopeIns) => `${scopeIns.id}&${scopeIns.name}&${scopeIns.type}`);
              }
              item.resource_groups && item.resource_groups.forEach((v) => {
                v.related_resource_types.forEach((related) => {
                  if (related.condition.length) {
                    related.condition.forEach((resource) => {
                      resource.instances.forEach((ins) => {
                        ins.path.forEach((p, pathIndex) => {
                          if (p.length > 0) {
                            // 处理授权范围是父级，但是选择了子集数据，需要查找所选数据是不是属于授权范围内的子集数据
                            // let curParentChain = [];
                            // const tempPath = p.filter(v => v.id !== '*');
                            // if (tempPath.length) {
                            //   curParentChain = tempPath.slice(0, tempPath.length - 1);
                            // }
                            const curParentChain = p.slice(0, p.length - 1);
                            // 判断授权范围是不是父级数据
                            const isExistParent = curParentChain.filter((subPath) => scopeInsList.includes(`${subPath.id}&${subPath.name}&${subPath.type}`));
                            // 只获取授权范围内的资源实例
                            ins.path[pathIndex] = p.filter((subPath) => scopeInsList.includes(`${subPath.id}&${subPath.name}&${subPath.type}`) || isExistParent.length > 0);
                          }
                        });
                        // 因为path链路是多维数组且无法确定链路数量，所以这里需要过滤掉空数组
                        ins.path = ins.path.filter((p) => p && p.length > 0);
                        if (ins.paths) {
                          ins.paths = cloneDeep(ins.path);
                        }
                      });
                      // 这里会存在path的内容不在授权范围内会被过滤掉，而path内容是必填项
                      resource.instances = resource.instances.filter((k) => k.path && k.path.length > 0);
                      if (resource.attributes && resource.attributes.length > 0
                        && scopeAttributeList && scopeAttributeList.length > 0
                      ) {
                        const scopeAttrList = scopeAttributeList.map((scopeAttr) => `${scopeAttr.id}&${scopeAttr.name}`);
                        const scopeAttrValues = scopeAttributeList.map((scopeAttr) => scopeAttr.values).flat(Infinity);
                        resource.attributes.forEach((attr) => {
                          if (scopeAttrList.includes(`${attr.id}&${attr.name}`)) {
                            attr.values = attr.values.filter((k) => scopeAttrValues.map((p) => `${p.id}&${p.name}`).includes(`${k.id}&${k.name}`));
                          }
                        });
                      }
                      // 如果有授权范围且没有范围内的实例和属性，清空instance和attribute
                      const isNoInstance = resource.instances.every((ins) => ins.path && ins.path.length === 0);
                      if (isNoInstance) {
                        resource.instances = [];
                      }
                      const hasCondition = related.condition.filter((k) =>
                        (k.instances && k.instances.length > 0) || (k.attributes && k.attributes.length > 0));
                      if (!hasCondition.length) {
                        related.condition = ['none'];
                      }
                    });
                  }
                });
              });
              // 判断是否有授权范围的数据
              hasScopeData = item.resource_groups[this.curGroupIndex].related_resource_types.some((v) => v.condition.length > 0 && v.condition[0] !== 'none');
            }
            if (hasScopeData) {
              this.tableList.splice(
                curIndex,
                1,
                new GroupPolicy(
                  {
                    ...item,
                    tag: 'add',
                    isShowRelatedText: true
                  },
                  '',
                  isTemplate ? 'template' : 'custom',
                  // new GroupPolicy 最后一个参数是 detail 就是 this.tableList[curIndex].detail
                  Object.assign({}, detail, {
                    system: {
                      id: detail.system.id,
                      name: detail.system.name
                    },
                    // 此 id 会在 handleSpanMethod 方法中使用到，合并单元格的依据，使用 CUSTOM_PERM_TEMPLATE_ID 会导致问题
                    // id: CUSTOM_PERM_TEMPLATE_ID
                    id: isTemplate ? detail.id : CUSTOM_PERM_TEMPLATE_ID
                  }),
                  true
                )
              );
            }
          }
        });
      },
      async showResourceInstance (data, index, resItem, resIndex, groupIndex) {
        window.changeDialog = true;
        this.params = {
          system_id: this.systemId,
          action_id: data.id,
          resource_type_system: resItem.system_id,
          resource_type_id: resItem.type
        };
        if (this.isCreateMode) {
          this.params.system_id = data.detail.system.id;
          await this.fetchAuthorizationScopeActions(this.params.system_id);
        }
        const scopeAction = this.authorization[this.params.system_id] || [];
        this.curScopeAction = cloneDeep(scopeAction.find(item => item.id === data.id));
        this.curIndex = index;
        this.curResIndex = resIndex;
        this.curGroupIndex = groupIndex;
        this.resourceInstanceSidesliderTitle = this.$t(`m.info['关联侧边栏操作的资源实例']`, { value: `${this.$t(`m.common['【']`)}${data.name}${this.$t(`m.common['】']`)}` });
        window.changeAlert = 'iamSidesider';
        this.isShowResourceInstanceSideslider = true;
      },
      // 请求资源实例数据
      async handleMainActionSubmit (payload, relatedActions) {
        // debugger
        const curPayload = cloneDeep(payload);
        this.sliderLoading = true;
        curPayload.forEach(item => {
          item.instances = item.instance || [];
          item.attributes = item.attribute || [];
          delete item.instance;
          delete item.attribute;
        });
        const tableList = cloneDeep(this.tableList);
        const curData = cloneDeep(tableList[this.curIndex]);
        // eslint-disable-next-line max-len
        curData.resource_groups[this.curGroupIndex].related_resource_types = [curData.resource_groups[this.curGroupIndex]
          .related_resource_types[this.curResIndex]];
        curData.resource_groups[this.curGroupIndex].related_resource_types[0].condition = curPayload;
        const relatedList = tableList.filter(item => {
          return !item.isAggregate
            && relatedActions.includes(item.id)
            && curData.detail.system.id === item.detail.system.id
            && item.resource_groups[this.curGroupIndex]
            && !item.resource_groups[this.curGroupIndex].related_resource_types.every(sub => sub.empty);
        });
        if (relatedList.length > 0) {
          relatedList.forEach(item => {
            delete item.policy_id;
            item.resource_groups[this.curGroupIndex].related_resource_types.forEach(resItem => {
              resItem.condition.forEach(conditionItem => {
                conditionItem.instances = conditionItem.instance || [];
                conditionItem.attributes = conditionItem.attribute || [];
                delete conditionItem.instance;
                delete conditionItem.attribute;
              });
            });
            item.expired_at = PERMANENT_TIMESTAMP;
          });
        }
        curData.resource_groups = curData.resource_groups.filter(item => item.related_resource_types);
        const targetPolicies = relatedList.filter(item =>
          item.resource_groups[this.curGroupIndex].related_resource_types
          && item.resource_groups[this.curGroupIndex].related_resource_types.length
          && (item.resource_groups[this.curGroupIndex].related_resource_types[0].condition.length === 0
            || item.resource_groups[this.curGroupIndex].related_resource_types[0].condition.some(
              (v) => v.instances.length > 0 || v.attributes.length > 0)));
        try {
          const res = await this.$store.dispatch('permApply/getRelatedPolicy', {
            source_policy: curData,
            system_id: curData.system_id,
            target_policies: targetPolicies
          });
          this.handleRelatedAction(res.data);
        } catch (e) {
          console.error(e);
          this.messageAdvancedError(e);
        } finally {
          this.sliderLoading = false;
        }
      },
      async fetchAuthorizationScopeActions (systemId) {
        try {
          const res = await this.$store.dispatch('permTemplate/getAuthorizationScopeActions', { systemId });
          this.authorization[systemId] = res.data.filter(item => item.id !== '*');
        } catch (e) {
          console.error(e);
          this.messageAdvancedError(e);
        }
      },
      async fetchActions (systemId) {
        const params = {
          system_id: systemId,
          user_id: this.user.username
        };
        try {
          const { data } = await this.$store.dispatch('permApply/getActions', params);
          this.curSystemActions = cloneDeep(data || []);
          this.handleActionLinearData();
        } catch (e) {
          this.messageAdvancedError(e);
        }
      },
      // 保存
      async handleResourceSubmit () {
        window.changeDialog = true;
        const conditionData = this.$refs.renderResourceRef.handleGetValue();
        const { isEmpty, data } = conditionData;
        if (isEmpty) {
          this.curIndex = -1;
          this.curResIndex = -1;
          this.curGroupIndex = -1;
          return;
        }
        const resItem = this.tableList[this.curIndex].resource_groups[this.curGroupIndex]
          .related_resource_types[this.curResIndex];
        const isConditionEmpty = data.length === 1 && data[0] === 'none';
        if (isConditionEmpty) {
          resItem.condition = ['none'];
        } else {
          const { isMainAction, related_actions, id, system_id: curSystemId } = this.tableList[this.curIndex];
          resItem.condition = data;
          resItem.isError = false;
          // 如果为主操作
          if (isMainAction) {
            await this.handleMainActionSubmit(data, related_actions);
          }
          // 如果没有变更实例，则从actions接口重新拉取最新的关联实例
          if (!isMainAction && curSystemId) {
            await this.fetchActions(curSystemId);
            if (this.relatedActionsList.length) {
              const policyIdList = this.tableList.map(v => v.id);
              const linearActionList = this.relatedActionsList.filter(item => policyIdList.includes(item.id));
              const curActions = linearActionList.filter(item => item.id === id);
              if (curActions.length) {
                const relatedList = curActions.map((v) => v.related_actions);
                if (relatedList.length) {
                  await this.handleMainActionSubmit(data, relatedList);
                }
              }
            }
          }
        }
        window.changeAlert = false;
        this.resourceInstanceSidesliderTitle = '';
        this.isShowResourceInstanceSideslider = false;
        this.$emit('on-resource-select', this.curIndex, this.curResIndex, resItem.condition, this.curGroupIndex);
        this.curIndex = -1;
        this.curResIndex = -1;
        this.curGroupIndex = -1;
        // 这里触发 create/index.vue 里 handleAggregateAction 事件会导致 tableList 变化，导致 list 属性变化
        // list 属性变化之后，isShowRelatedText 属性以及其他属性均会重置
        // if (!this.isAllExpanded) {
        //     // 调用合并展开的方法 重组tableList的排序
        //     this.$emit('handleAggregateAction', false)
        // }
      },
      handleActionLinearData () {
        const linearActions = [];
        this.curSystemActions.forEach((item) => {
          item.actions.forEach(act => {
            linearActions.push(act);
          });
          (item.sub_groups || []).forEach(sub => {
            sub.actions.forEach(act => {
              linearActions.push(act);
            });
          });
        });
        this.relatedActionsList = cloneDeep(linearActions);
      },
      handlerConditionMouseover (payload) {
        if (Object.keys(this.curCopyParams).length < 1 && this.curCopyMode === 'normal') {
          return;
        }
        if (this.curCopyData[0] === 'none' && this.curCopyMode === 'aggregate') {
          return;
        }
        if (this.curCopyKey === `${payload.system_id}${payload.type}`) {
          payload.canPaste = true;
        }
      },
      handlerConditionMouseleave (payload) {
        payload.canPaste = false;
      },
      handlerOnView (payload, item, itemIndex) {
        const { system_id, type, name } = item;
        const condition = [];
        item.condition.forEach(item => {
          const { id, attribute, instance } = item;
          condition.push({
            id,
            attributes: attribute ? attribute.filter(item => item.values.length > 0) : [],
            instances: instance ? instance.filter(item => item.path.length > 0) : []
          });
        });
        this.previewResourceParams = {
          id: this.templateId,
          action_id: payload.id,
          related_resource_type: {
            system_id,
            type,
            name,
            condition: condition.filter(item => item.attributes.length > 0 || item.instances.length > 0)
          },
          reverse: true,
          groupId: this.groupId,
          policy_id: payload.policy_id,
          resource_group_id: payload.resource_groups[this.curGroupIndex].id,
          isTemplate: payload.isTemplate
        };
        this.previewDialogTitle = this.$t(`m.info['操作侧边栏操作的资源实例差异对比']`, { value: `${this.$t(`m.common['【']`)}${payload.name}${this.$t(`m.common['】']`)}` });
        if (!this.previewResourceParams.id) {
          this.$bkMessage({
            limit: 1,
            theme: 'error',
            message: this.$t(`m.info['无资源ID，无法预览']`)
          });
          return;
        }
        this.isShowPreviewDialog = true;
      },
      handlerOnCopy (payload, index, subIndex, action) {
        window.changeDialog = true;
        this.curCopyKey = `${payload.system_id}${payload.type}`;
        this.curCopyData = cloneDeep(payload.condition);
        this.curCopyMode = 'normal';
        this.curCopyParams = this.getBatchCopyParams(action, payload);
        this.showMessage(this.$t(`m.info['实例复制']`));
        this.$refs[`condition_${index}_${subIndex}_ref`][0] && this.$refs[`condition_${index}_${subIndex}_ref`][0].setImmediatelyShow(true);
      },
      getBatchCopyParams (payload, content) {
        const actions = [];
        this.tableList.forEach(item => {
          if (!item.isAggregate) {
            if (item.id !== payload.id) {
              actions.push({
                system_id: item.detail.system.id,
                id: item.id
              });
            }
          }
        });
        actions.unshift({
          system_id: payload.detail.system.id,
          id: payload.id
        });
        return {
          resource_type: {
            system_id: content.system_id,
            type: content.type,
            condition: content.condition.map(item => {
              return {
                id: item.id,
                instances: item.instance || [],
                attributes: item.attribute || []
              };
            })
          },
          actions
        };
      },
      handlerOnPaste (payload, content, $index, contentIndex) {
        // debugger
        let tempCurData = ['none'];
        if (this.curCopyMode === 'normal') {
          if (!payload.flag) {
            return;
          }
          if (payload.data.length === 0) {
            content.condition = [];
          } else {
            content.condition = payload.data.map(conditionItem => new Condition(conditionItem, '', 'add'));
          }
        } else {
          const instances = (() => {
            const arr = [];
            const { id, name, system_id } = this.curAggregateResourceType;
            this.curCopyData.forEach(v => {
              const curItem = arr.find(_ => _.type === id);
              if (curItem) {
                curItem.path.push([{
                  id: v.id,
                  name: v.name,
                  system_id,
                  type: id,
                  type_name: name
                }]);
              } else {
                arr.push({
                  name,
                  type: id,
                  path: [[{
                    id: v.id,
                    name: v.name,
                    system_id,
                    type: id,
                    type_name: name
                  }]]
                });
              }
            });
            return arr;
          })();
          if (instances.length > 0) {
            tempCurData = [new Condition({ instances }, '', 'add')];
          }
          if (tempCurData[0] === 'none') {
            return;
          }
          content.condition = cloneDeep(tempCurData);
        }
        content.isError = false;
        this.showMessage(this.$t(`m.info['粘贴成功']`));
      },
      handlerOnBatchPaste (payload, content, index, subIndex) {
        let tempCurData = ['none'];
        let tempArrAggregateData = [];
        let tempAttrAggregateData = [];
        if (this.curCopyMode === 'normal') {
          if (!payload.flag) {
            return;
          }
          // 预计算是否存在 聚合后的数据 可以粘贴
          // const flag = this.tableList.some(item => !!item.isAggregate
          //     && `${item.aggregateResourceType[item.selectedIndex].system_id}${item.aggregateResourceType[item.selectedIndex].id}` === this.curCopyKey);
          const flag = this.tableList.some(item => {
            return !!item.isAggregate
              && item.aggregateResourceType.some(e => `${e.system_id}${e.id}` === this.curCopyKey);
          });
          if (flag) {
            if (this.curCopyData.length < 1) {
              tempCurData = [];
            } else {
              if (this.curCopyData[0] !== 'none') {
                tempCurData = this.curCopyData.map(item => {
                  delete item.id;
                  return item;
                });
                tempCurData.forEach((item, index) => {
                  if (content.condition[index]) {
                    if (content.condition[index].id) {
                      item.id = content.condition[index].id;
                    } else {
                      item.id = '';
                    }
                  } else {
                    item.id = '';
                  }
                });
                const instances = this.curCopyData.map(item => item.instance);
                const instanceData = instances[0][0];
                tempArrAggregateData = instanceData.path.map(pathItem => {
                  return {
                    id: pathItem[0].id,
                    name: pathItem[0].name
                  };
                });
              }
            }
          }
          if (payload.data.length === 0) {
            this.tableList.forEach(item => {
              if (!item.isAggregate) {
                item.resource_groups.forEach(groupItem => {
                  groupItem.related_resource_types.forEach(resItem => {
                    if (`${resItem.system_id}${resItem.type}` === this.curCopyKey) {
                      resItem.condition = [];
                      resItem.isError = false;
                    }
                  });
                });
              } else {
                if (`${item.aggregateResourceType[item.selectedIndex].system_id}${item.aggregateResourceType[item.selectedIndex].id}` === this.curCopyKey) {
                  item.instances = cloneDeep(tempArrAggregateData);
                  item.isError = false;
                  this.$emit('on-select', item);
                }
              }
            });
          } else {
            this.tableList.forEach(item => {
              if (!item.isAggregate) {
                const curPasteData = (payload.data || []).find(_ => _.id === item.id);
                if (curPasteData) {
                  const systemId = this.isCreateMode && item.detail ? item.detail.system.id : this.systemId;
                  const scopeAction = this.authorization[systemId] || [];
                  const curScopeAction = cloneDeep(scopeAction.find(scopeItem => scopeItem.id === item.id));
                  if (curScopeAction && curScopeAction.resource_groups && curScopeAction.resource_groups.length) {
                    curScopeAction.resource_groups.forEach(curScopeActionItem => {
                      curScopeActionItem.related_resource_types.forEach(curResItem => {
                        if (`${curResItem.system_id}${curResItem.type}` === `${curPasteData.resource_type.system_id}${curPasteData.resource_type.type}`) {
                          let canPasteName = [];
                          let hasConditionData = [];
                          let noConditionData = [];
                          const hasCurCondition = curResItem.condition && curResItem.condition.length > 0;
                          if (
                            hasCurCondition
                            && curResItem.condition[0].instances
                            && curResItem.condition[0].instances.length > 0
                          ) {
                            hasConditionData = curResItem.condition[0].instances[0].path.reduce((p, v) => {
                              p.push(v[0].name);
                              return p;
                            }, []);
                          } else {
                            // 处理分级管理员下多个无限制操作的批量粘贴
                            if (this.curCopyParams.resource_type.condition
                              && this.curCopyParams.resource_type.condition.length) {
                              let instancesData = this.curCopyParams.resource_type.condition[0].instances;
                              if (!instancesData) {
                                instancesData = this.curCopyParams.resource_type.condition[0].instance;
                              }
                              noConditionData = instancesData[0].path.reduce((p, v) => {
                                p.push(v[0].name);
                                return p;
                              }, []);
                            }
                          }
                          canPasteName = [...hasConditionData, ...noConditionData];
                          // eslint-disable-next-line max-len
                          item.resource_groups.forEach(groupItem => {
                            groupItem.related_resource_types.forEach(resItem => {
                              if (`${resItem.system_id}${resItem.type}` === `${curPasteData.resource_type.system_id}${curPasteData.resource_type.type}`) {
                                // eslint-disable-next-line max-len
                                const curPasteDataCondition = curPasteData.resource_type.condition;
                                // eslint-disable-next-line max-len
                                const condition = curPasteDataCondition.map(c => {
                                  c.instances.forEach(j => {
                                    // eslint-disable-next-line max-len
                                    j.path = j.path.filter(e => {
                                      if (!canPasteName.includes(e[0].name)) {
                                        return false;
                                      }
                                      return canPasteName.includes(e[0].name);
                                    });
                                  });
                                  return c;
                                  // eslint-disable-next-line max-len
                                }).filter(d => !!(d.instances[0].path && d.instances[0].path.length));
                                if (condition && condition.length) {
                                  resItem.condition = condition.map(conditionItem => new Condition(conditionItem, '', 'add'));
                                  resItem.isError = false;
                                }
                              }
                            });
                          });
                        }
                      });
                    });
                  } else {
                    item.resource_groups && item.resource_groups.forEach(groupItem => {
                      groupItem.related_resource_types && groupItem.related_resource_types.forEach(resItem => {
                        if (`${resItem.system_id}${resItem.type}` === `${curPasteData.resource_type.system_id}${curPasteData.resource_type.type}`) {
                          resItem.condition = curPasteData.resource_type.condition.map(conditionItem => new Condition(conditionItem, '', 'add'));
                          resItem.isError = false;
                        }
                      });
                    });
                  }
                }
              } else {
                const scopeAction = cloneDeep(payload.data.find(_ => item.actions.map((v) => v.id).includes(_.id)));
                item.aggregateResourceType && item.aggregateResourceType.forEach(aggregateResourceItem => {
                  const systemId = this.isSuperManager
                    ? aggregateResourceItem.system_id : item.system_id;
                  if (`${systemId}${aggregateResourceItem.id}` === this.curCopyKey && scopeAction) {
                    item.instances = cloneDeep(tempArrAggregateData);
                    this.instanceKey = aggregateResourceItem.id;
                    this.setNormalInstancesDisplayData(item, this.instanceKey);
                    this.instanceKey = ''; // 重置
                    item.isError = false;
                  }
                });
                this.$emit('on-select', item);
              }
            });
          }
        } else {
          tempArrAggregateData = this.curCopyData;
          tempAttrAggregateData = this.curCopyAttrData;
          const instances = (() => {
            const arr = [];
            const { id, name, system_id } = this.curAggregateResourceType;
            this.curCopyData.forEach(v => {
              const curItem = arr.find(_ => _.type === id);
              if (curItem) {
                curItem.path.push([{
                  id: v.id,
                  name: v.name,
                  system_id,
                  type: id,
                  type_name: name
                }]);
              } else {
                arr.push({
                  name,
                  type: id,
                  path: [[{
                    id: v.id,
                    name: v.name,
                    system_id,
                    type: id,
                    type_name: name
                  }]]
                });
              }
            });
            return arr;
          })();
          const attributes = (() => {
            const arr = [];
            const { id } = this.curAggregateResourceType;
            this.curCopyAttrData.forEach(v => {
              const curItem = arr.find(_ => _.type === id);
              if (curItem) {
                arr.push(v);
              } else {
                arr.push({
                  ...v,
                  ...{
                    type: id
                  }
                });
              }
            });
            return arr;
          })();
          const isExistData = instances.length > 0 || attributes.length > 0;
          if (isExistData) {
            tempCurData = [new Condition({ instances, attributes }, '', 'add')];
          }
          this.tableList.forEach(item => {
            if (!item.isAggregate) {
              item.resource_groups.forEach(groupItem => {
                groupItem.related_resource_types.forEach((subItem, subItemIndex) => {
                  if (`${subItem.system_id}${subItem.type}` === this.curCopyKey) {
                    subItem.condition = cloneDeep(tempCurData);
                    subItem.isError = false;
                    this.$emit('on-resource-select', index, subItemIndex, subItem.condition);
                  }
                });
              });
            } else {
              if (`${item.aggregateResourceType.system_id}${item.aggregateResourceType.id}` === this.curCopyKey) {
                item.instances = cloneDeep(tempArrAggregateData);
                item.attributes = cloneDeep(tempAttrAggregateData);
                item.isError = false;
                this.$emit('on-select', item);
              }
            }
          });
        }
        content.isError = false;
        this.$refs[`condition_${index}_${subIndex}_ref`][0] && this.$refs[`condition_${index}_${subIndex}_ref`][0].setImmediatelyShow(false);
        this.curCopyData = ['none'];
        this.curCopyAttrData = [];
        this.showMessage(this.$t(`m.info['批量粘贴成功']`));
      },
      handlePreviewDialogClose () {
        this.previewDialogTitle = '';
        this.previewResourceParams = {};
        this.isShowPreviewDialog = false;
      },
      resetDataAfterClose () {
        this.curIndex = -1;
        this.curResIndex = -1;
        this.curGroupIndex = -1;
        this.previewResourceParams = {};
        this.params = {};
        this.resourceInstanceSidesliderTitle = '';
      },
      handleResourceCancel (payload) {
        const typeMap = {
          mask: () => {
            const { data } = this.$refs.renderResourceRef.handleGetValue();
            const { hasSelectedCondition } = this.$refs.renderResourceRef;
            let cancelHandler = Promise.resolve();
            if (JSON.stringify(data) !== JSON.stringify(hasSelectedCondition)) {
              cancelHandler = leaveConfirm();
            }
            cancelHandler.then(() => {
              this.isShowResourceInstanceSideslider = false;
              this.resetDataAfterClose();
            }, _ => _);
          },
          cancel: () => {
            this.resetDataAfterClose();
            this.isShowResourceInstanceSideslider = false;
          }
        };
        return typeMap[payload]();
      },
      getData () {
        let flag = false;
        const templates = [];
        // debugger
        // 自定义时的模板id为0
        if (this.tableList.length < 1) {
          flag = true;
          return {
            flag,
            templates
          };
        }

        // 重新赋值
        // if (this.isAllExpanded) {
        //     this.tableList = this.tableList.filter(e =>
        //         (e.resource_groups && e.resource_groups.length)
        //         || e.isAggregate);
        //     if (this.emptyResourceGroupsList.length) {
        //         this.emptyResourceGroupsList[0].name = this.emptyResourceGroupsName[0];
        //         this.tableList = [...this.tableList, ...this.emptyResourceGroupsList];
        //     }
        // }

        this.tableList.forEach(item => {
          let actionParam = {};
          let aggregationParam = {};
          let systemId = '';
          if (!item.isAggregate) {
            const groupResourceTypes = [];
            const { type, id, name, environment, description } = item;
            systemId = item.detail.system.id;
            if (item.resource_groups.length > 0) {
              item.resource_groups.forEach(groupItem => {
                const relatedResourceTypes = [];
                if (groupItem.related_resource_types.length > 0) {
                  groupItem.related_resource_types.forEach(resItem => {
                    if (resItem.empty) {
                      resItem.isError = true;
                      flag = true;
                    }
                    const conditionList = (resItem.condition.length > 0 && !resItem.empty)
                      ? resItem.condition.map(conItem => {
                        const { id, instance, attribute } = conItem;
                        const attributeList = (attribute && attribute.length > 0)
                          ? attribute.map(({ id, name, values }) => ({ id, name, values }))
                          : [];
                        const instanceList = (instance && instance.length > 0)
                          ? instance.map(({ name, type, path, paths }) => {
                            // 这里paths和path存在数据不同步问题，所以当paths为空时，需要判断path是否存在数据
                            let tempPath = cloneDeep(paths);
                            if (!tempPath.length && path && path.length) {
                              tempPath = cloneDeep(path);
                            }
                            tempPath.forEach(pathItem => {
                              pathItem.forEach(pathSubItem => {
                                delete pathSubItem.disabled;
                              });
                            });
                            return {
                              name,
                              type,
                              path: tempPath
                            };
                          })
                          : [];
                        return {
                          id,
                          instances: instanceList,
                          attributes: attributeList
                        };
                      })
                      : [];
                    relatedResourceTypes.push({
                      type: resItem.type,
                      system_id: resItem.system_id,
                      name: resItem.name,
                      condition: conditionList.filter(
                        item => item.instances.length > 0 || item.attributes.length > 0
                      )
                    });
                  });
                }
                groupResourceTypes.push({
                  id: groupItem.id,
                  related_resource_types: relatedResourceTypes
                });
              });
              // 强制刷新下
              item.resource_groups = cloneDeep(item.resource_groups);
            }
            actionParam = {
              type,
              name,
              id,
              description,
              resource_groups: groupResourceTypes,
              environment
            };
          } else {
            systemId = item.system_id;
            const { actions, aggregateResourceType, instances, instancesDisplayData } = item;
            if (instances.length < 1) {
              item.isError = true;
              flag = true;
            } else {
              const temps = cloneDeep(actions);
              temps.forEach(sub => {
                sub.system_id = sub.detail.system.id;
              });
              const aggregateResourceTypes = aggregateResourceType.reduce((p, e) => {
                if (instancesDisplayData[e.id] && instancesDisplayData[e.id].length) {
                  const obj = {};
                  obj.id = e.id;
                  obj.system_id = e.system_id;
                  obj.instances = instancesDisplayData[e.id];
                  p.push(obj);
                }
                return p;
              }, []);
              aggregationParam = {
                actions: temps,
                aggregate_resource_types: aggregateResourceTypes,
                expired_at: PERMANENT_TIMESTAMP
              };
            }
          }
          // eslint-disable-next-line max-len
          const templateId = item.isTemplate ? item.isAggregate ? item.actions[0].detail.id : item.detail.id : CUSTOM_PERM_TEMPLATE_ID;
          const compareId = `${templateId}&${systemId}`;
          const isHasAggregation = Object.keys(aggregationParam).length > 0;
          const isHasActions = Object.keys(actionParam).length > 0;
          if (!templates.map(sub => `${sub.template_id}&${sub.system_id}`).includes(compareId)) {
            templates.push({
              system_id: systemId,
              template_id: templateId,
              actions: isHasActions ? [actionParam] : [],
              aggregations: isHasAggregation ? [aggregationParam] : []
            });
          } else {
            const tempActionData = templates.find(sub => `${sub.template_id}&${sub.system_id}` === compareId);
            if (tempActionData) {
              if (isHasActions) {
                if (!tempActionData.actions.map(_ => _.id).includes(actionParam.id)) {
                  tempActionData.actions.push(actionParam);
                }
              }
              if (isHasAggregation) {
                tempActionData.aggregations.push(aggregationParam);
              }
            }
          }
        });
        return {
          flag,
          templates
        };
      },
      getDataByNormal () {
        if (this.isCreateMode) {
          this.getData();
          return;
        }
        let flag = false;
        if (this.tableList.length < 1) {
          flag = true;
          return {
            flag,
            actions: [],
            aggregations: []
          };
        }
        const actionList = [];
        const aggregations = [];
        this.tableList.forEach(item => {
          if (!item.isAggregate) {
            const groupResourceTypes = [];
            const { type, id, name, environment, description } = item;
            if (item.resource_groups.length > 0) {
              item.resource_groups.forEach(groupItem => {
                const relatedResourceTypes = [];
                if (groupItem.related_resource_types.length > 0) {
                  groupItem.related_resource_types.forEach(resItem => {
                    if (resItem.empty) {
                      resItem.isError = true;
                      flag = true;
                    }
                    const conditionList = (resItem.condition.length > 0 && !resItem.empty)
                      ? resItem.condition.map(conItem => {
                        const { id, instance, attribute } = conItem;
                        const attributeList = (attribute && attribute.length > 0)
                          ? attribute.map(({ id, name, values }) => ({ id, name, values }))
                          : [];
                        const instanceList = (instance && instance.length > 0)
                          ? instance.map(({ name, type, path, paths }) => {
                            // 这里paths和path存在数据不同步问题，所以当paths为空时，需要判断path是否存在数据
                            let tempPath = cloneDeep(paths);
                            if (!tempPath.length && path && path.length) {
                              tempPath = cloneDeep(path);
                            }
                            tempPath.forEach(pathItem => {
                              pathItem.forEach(pathSubItem => {
                                delete pathSubItem.disabled;
                              });
                            });
                            return {
                              name,
                              type,
                              path: tempPath
                            };
                          })
                          : [];
                        return {
                          id,
                          instances: instanceList,
                          attributes: attributeList
                        };
                      })
                      : [];
                    relatedResourceTypes.push({
                      type: resItem.type,
                      system_id: resItem.system_id,
                      name: resItem.name,
                      condition: conditionList.filter(
                        item => item.instances.length > 0 || item.attributes.length > 0
                      )
                    });
                  });
                }

                groupResourceTypes.push({
                  id: groupItem.id,
                  related_resource_types: relatedResourceTypes
                });
              });
              // 强制刷新下
              item.resource_groups = cloneDeep(item.resource_groups);
            }
            const params = {
              type,
              name,
              id,
              description,
              resource_groups: groupResourceTypes,
              environment
            };
            actionList.push(cloneDeep(params));
          } else {
            const { actions, aggregateResourceType, instances } = item;
            if (instances.length < 1) {
              item.isError = true;
              flag = true;
            } else {
              const params = {
                actions,
                aggregate_resource_type: {
                  id: aggregateResourceType.id,
                  system_id: aggregateResourceType.system_id,
                  instances
                }
              };
              aggregations.push(params);
            }
          }
        });
        return {
          flag,
          actions: actionList,
          aggregations
        };
      },

      selectResourceType (data, index) {
        data.selectedIndex = index;
        this.selectedIndex = index;
      },

      handleGetValue () {
        // flag：提交时校验标识
        let flag = false;
        if (this.tableList.length < 1) {
          flag = true;
          return {
            flag,
            actions: [],
            attach_actions: []
          };
        }
        const actionList = [];

        // 重新赋值
        // 资源授权与操作不一致的bug
        // if (this.isAllExpanded) {
        //     this.tableList = this.tableList.filter(e =>
        //         (e.resource_groups && e.resource_groups.length)
        //         || e.isAggregate);
        //     if (this.emptyResourceGroupsList.length) {
        //         this.emptyResourceGroupsList[0].name = this.emptyResourceGroupsName[0];
        //         this.tableList = [...this.tableList, ...this.emptyResourceGroupsList];
        //     }
        // }
        this.tableList.forEach(item => {
          const curSystemData = actionList.find(subItem => subItem.system_id === item.detail.system.id);
          if (!item.isAggregate) {
            const groupResourceTypes = [];
            if (item.resource_groups.length > 0) {
              item.resource_groups.forEach(groupItem => {
                const relatedResourceTypes = [];
                if (groupItem.related_resource_types.length > 0) {
                  groupItem.related_resource_types.forEach(resItem => {
                    if (resItem.empty) {
                      resItem.isError = true;
                      flag = true;
                    }
                    const conditionList = (resItem.condition.length > 0 && !resItem.empty)
                      ? resItem.condition.map(conItem => {
                        const { id, instance, attribute } = conItem;
                        const attributeList = (attribute && attribute.length > 0)
                          // eslint-disable-next-line max-len
                          ? attribute.map(({ id, name, values }) => ({ id, name, values })) : [];
        
                        const instanceList = (instance && instance.length > 0)
                          ? instance.map(({ name, type, path, paths }) => {
                            let tempPath = cloneDeep(paths);
                            if (!tempPath.length && path && path.length) {
                              tempPath = cloneDeep(path);
                            }
                            tempPath.forEach(pathItem => {
                              pathItem.forEach(pathSubItem => {
                                delete pathSubItem.disabled;
                              });
                            });
                            return {
                              name,
                              type,
                              path: tempPath
                            };
                          })
                          : [];
                        return {
                          id,
                          instances: instanceList,
                          attributes: attributeList
                        };
                      })
                      : [];
                    relatedResourceTypes.push({
                      type: resItem.type,
                      system_id: resItem.system_id,
                      name: resItem.name,
                      condition: conditionList
                    });
                  });
                }
                groupResourceTypes.push({
                  id: groupItem.id,
                  related_resource_types: relatedResourceTypes
                });
              });
            }
            const params = {
              system_id: item.detail.system.id,
              actions: [
                {
                  id: item.id,
                  resource_groups: groupResourceTypes
                }
              ],
              aggregations: []
            };
            if (curSystemData) {
              curSystemData.actions.push({
                id: item.id,
                resource_groups: groupResourceTypes
              });
            } else {
              actionList.push(params);
            }
          } else {
            const { actions, aggregateResourceType, instances, instancesDisplayData } = item;
            if (instances.length < 1) {
              item.isError = true;
              flag = true;
            }
            if (instances.length > 0) {
              const aggregateResourceTypes = aggregateResourceType.reduce((p, e) => {
                if (instancesDisplayData[e.id] && instancesDisplayData[e.id].length) {
                  const obj = {};
                  obj.id = e.id;
                  obj.system_id = e.system_id;
                  obj.instances = instancesDisplayData[e.id];
                  p.push(obj);
                }
                return p;
              }, []);
              const aggregateParams = {
                system_id: item.system_id,
                aggregations: [{
                  actions,
                  aggregate_resource_types: aggregateResourceTypes
                }],
                actions: []
              };
              if (curSystemData) {
                curSystemData.aggregations.push({
                  actions,
                  aggregate_resource_types: aggregateResourceTypes
                });
              } else {
                actionList.push(aggregateParams);
              }
            }
          }
        });
        return {
          flag,
          actions: actionList
        };
      }
    }
  };
</script>

<style lang="postcss" scoped>
@import '@/css/mixins/space-resource-instance-table.css';
</style>
