/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云-权限中心(BlueKing-IAM) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云-权限中心(BlueKing-IAM) is licensed under the MIT License.
 *
 * License for 蓝鲸智云-权限中心(BlueKing-IAM):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
*/
import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { il8n, language } from '@/language';
import { CUSTOM_PERM_TEMPLATE_ID } from '@/common/constants';

export default class GroupAggregationPolicy {
  constructor (payload) {
    this.isError = payload.isError || false;
    this.actions = payload.actions || [];
    this.instancesDisplayData = payload.instancesDisplayData || {};
    this.attributesDisplayData = payload.attributesDisplayData || {};
    this.aggregateResourceType = payload.aggregate_resource_types || payload.aggregateResourceType || [];
    this.instances = payload.instances || [];
    this.attributes = payload.attributes || [];
    this.instancesBackup = cloneDeep(this.instances);
    this.isAggregate = true;
    this.system_id = payload.actions[0].detail.system.id;
    this.system_name = payload.actions[0].detail.system.name;
    this.canPaste = false;
    this.aggregationId = payload.aggregationId || '';
    this.selectedIndex = payload.selectedIndex || 0;
    // 是否需要展示无限制
    this.isNeedNoLimited = payload.isNeedNoLimited;
    // 是否是无限制操作
    this.isNoLimited = payload.isNoLimited;
    this.tag = payload.tag || 'add';
    this.initDetailData(this.actions);
  }

  initDetailData (payload) {
    if (payload.length < 1) {
      this.detail = {};
      return;
    }
    this.detail = payload[0].detail;
  }

  get isTemplate () {
    if (this.actions.length > 0) {
      return this.actions[0].detail.id !== CUSTOM_PERM_TEMPLATE_ID;
    }
    return false;
  }

  get empty () {
    const isEmpty = this.attributes.length < 1 && this.instances.length < 1;
    if (this.isNeedNoLimited) {
      if (isEmpty || ((this.instances.length === 1 && this.instances[0] === 'none') && this.attributes.length < 1)) {
        return true;
      }
      return false;
    } else {
      return isEmpty;
    }
  }

  get value () {
    if (this.empty) {
      return il8n('verify', '请选择');
    }
    if ((this.isNoLimited || (!this.empty && !['add'].includes(this.tag)))) {
      return il8n('common', '无限制');
    }
    let instanceStr = '';
    let attributeStr = '';
    this.aggregateResourceType.length && this.aggregateResourceType.forEach(item => {
      if (!this.instancesDisplayData[item.id]) {
        instanceStr = '';
        this.instancesDisplayData[item.id] = [];
      }
      if (!this.attributesDisplayData[item.id]) {
        attributeStr = '';
        this.attributesDisplayData[item.id] = [];
      }
      const instanceData = this.instancesDisplayData[item.id];
      const attributeData = this.attributesDisplayData[item.id];
      // 格式化聚合实例显示内容
      if (instanceData) {
        if (instanceData.length > 1) {
          for (const key in this.instancesDisplayData) {
            if (item.id === key) {
              instanceStr = language === 'zh-cn' ? `${instanceStr}，已选择${instanceData.length}个${item.name}` : `${instanceStr}, selected ${instanceData.length} ${item.name}(s)`;
            }
          }
        } else {
          // 这里防止切换tab下存在空数据，需要重新判断下
          if (instanceData && instanceData.length === 1) {
            instanceStr = `${instanceStr}${il8n('common', '，')}${item.name}${il8n('common', '：')}${instanceData[0].name}`;
          }
        }
      }
      // 格式化聚合属性条件显示内容
      if (attributeData) {
        Object.keys(this.attributesDisplayData).forEach((key) => {
          if (item.id === key && attributeData.length > 0) {
            attributeStr = `${il8n('resource', '已设置')} ${attributeData.length} ${il8n('resource', '个属性条件')}`;
          }
        });
      }
      const displayValue = [attributeStr, instanceStr.substring(1, instanceStr.length)].filter(v => v !== '').join('；');
      Vue.set(item, 'displayValue', displayValue);
      instanceStr = '';
      attributeStr = '';
    });
    const aggregateResourceType = cloneDeep(this.aggregateResourceType.map(v => v.displayValue));
    return aggregateResourceType.join();
  }

  get name () {
    if (this.actions.length < 1) {
      return '';
    }
    return this.actions.map(item => item.name).join('，');
  }

  get key () {
    if (this.actions.length < 1) {
      return '';
    }
    return this.actions.map(item => item.id).join('');
  }
}
