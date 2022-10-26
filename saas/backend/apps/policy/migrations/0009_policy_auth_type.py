# Generated by Django 2.2.28 on 2022-06-06 04:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('policy', '0008_auto_20211103_1458'),
    ]

    operations = [
        migrations.AddField(
            model_name='policy',
            name='auth_type',
            field=models.CharField(choices=[('rbac', 'RBAC'), ('abac', 'ABAC'), ('all', 'ALL'), ('none', 'NONE')], default='abac', max_length=16, verbose_name='策略的鉴权类型'),
        ),
    ]
