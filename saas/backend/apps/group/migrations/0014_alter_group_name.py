# Generated by Django 3.2.16 on 2023-01-31 06:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('group', '0013_auto_20221110_1510'),
    ]

    operations = [
        migrations.AlterField(
            model_name='group',
            name='name',
            field=models.CharField(max_length=512, verbose_name='名称'),
        ),
    ]
