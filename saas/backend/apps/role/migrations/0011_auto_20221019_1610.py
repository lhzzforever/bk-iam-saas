# Generated by Django 2.2.28 on 2022-10-19 08:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('role', '0010_auto_20220424_2320'),
    ]

    operations = [
        migrations.AlterField(
            model_name='role',
            name='type',
            field=models.CharField(choices=[('staff', '个人用户'), ('super_manager', '超级管理员'), ('system_manager', '系统管理员'), ('rating_manager', '分级管理员'), ('subset_manager', '子集管理员')], max_length=32, verbose_name='类型'),
        ),
        migrations.CreateModel(
            name='RoleRelation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('creator', models.CharField(max_length=64, verbose_name='创建者')),
                ('updater', models.CharField(max_length=64, verbose_name='更新者')),
                ('created_time', models.DateTimeField(auto_now_add=True)),
                ('updated_time', models.DateTimeField(auto_now=True)),
                ('parent_id', models.IntegerField(verbose_name='父级角色ID')),
                ('role_id', models.IntegerField(verbose_name='角色ID')),
            ],
            options={
                'verbose_name': '角色关系',
                'verbose_name_plural': '角色关系',
                'unique_together': {('parent_id', 'role_id')},
            },
        ),
    ]