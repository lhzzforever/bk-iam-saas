# -*- coding: utf-8 -*-
"""
TencentBlueKing is pleased to support the open source community by making 蓝鲸智云-权限中心(BlueKing-IAM) available.
Copyright (C) 2017-2021 THL A29 Limited, a Tencent company. All rights reserved.
Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://opensource.org/licenses/MIT
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
"""
import os
from typing import Dict, List

from django.conf import settings
from django.utils import translation

from backend.common.constants import DjangoLanguageEnum

from .constants import MD_FILE_DATE_PATTERN, MD_FILE_NAME, MD_FILE_NAME_EN, MD_FILE_VERSION_PATTERN


def _read_file_content(file_path: str) -> str:
    """读取文件内容"""
    content = ""
    if os.path.isfile(file_path):
        with open(file_path, encoding="utf-8") as f:
            content = f.read()
    return content


def _get_chang_log_file_name() -> str:
    """获取日志文件名称"""
    if translation.get_language() == DjangoLanguageEnum.EN.value:
        return MD_FILE_NAME_EN
    return MD_FILE_NAME


def get_version_list() -> List[Dict[str, str]]:
    """
    获取md日志版本列表
    :return {版本号, 日期, 文件内容} 字段列表，列表根据版本号从大到小排列
    """
    file_dir = settings.VERSION_LOG_MD_FILES_DIR
    if not os.path.isdir(file_dir):  # md文件夹不存在
        return []

    file_name = _get_chang_log_file_name()
    if not os.path.isfile(os.path.join(file_dir, file_name)):
        return []

    text = _read_file_content(os.path.join(file_dir, file_name))

    data = []
    for log in text.split("---"):
        try:
            parts = log.strip().split("\n")

            date = MD_FILE_DATE_PATTERN.findall(parts[0])[0]  # 从第一行提取日期
            version = MD_FILE_VERSION_PATTERN.findall(parts[1])[0]  # 从第二行提取版本号

            content = "\n".join(parts[1:])  # 去除日期注释, 重新组合

            data.append({"version": version, "date": date, "content": content})
        except Exception:  # pylint: disable=broad-except
            pass

    return data
