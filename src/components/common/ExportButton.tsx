/**
 * 数据导出按钮组件
 * 支持CSV和Excel格式的数据导出
 */

import React, { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { exportToExcel, exportToCSV } from '../../services/reports';
import type { ExportData } from '../../types/report';

/**
 * 导出按钮组件属性
 */
interface ExportButtonProps {
  /** 导出数据 */
  data: any[];
  /** 文件名（不含扩展名） */
  filename: string;
  /** Excel表格名称 */
  sheetName?: string;
  /** 按钮文本 */
  buttonText?: string;
  /** 按钮类型 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义数据处理函数 */
  dataProcessor?: (data: any[]) => any[];
}

/**
 * 数据导出按钮组件
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  sheetName = 'Sheet1',
  buttonText = '导出数据',
  type = 'default',
  size = 'middle',
  disabled = false,
  dataProcessor
}) => {
  const [loading, setLoading] = useState(false);

  /**
   * 处理导出数据
   */
  const processData = (rawData: any[]): any[] => {
    if (dataProcessor) {
      return dataProcessor(rawData);
    }
    return rawData;
  };

  /**
   * 导出为Excel
   */
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      
      if (!data || data.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }

      const processedData = processData(data);
      const exportData: ExportData = {
        data: processedData,
        filename,
        sheetName
      };

      exportToExcel(exportData);
      message.success('Excel文件导出成功');
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出Excel失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 导出为CSV
   */
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      
      if (!data || data.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }

      const processedData = processData(data);
      const exportData: ExportData = {
        data: processedData,
        filename
      };

      exportToCSV(exportData);
      message.success('CSV文件导出成功');
    } catch (error) {
      console.error('导出CSV失败:', error);
      message.error('导出CSV失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 菜单项配置
   */
  const menuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Excel (.xlsx)',
      onClick: handleExportExcel
    },
    {
      key: 'csv',
      icon: <FileTextOutlined />,
      label: 'CSV (.csv)',
      onClick: handleExportCSV
    }
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      disabled={disabled || loading}
    >
      <Button
        type={type}
        size={size}
        icon={<DownloadOutlined />}
        loading={loading}
        disabled={disabled}
      >
        {buttonText}
      </Button>
    </Dropdown>
  );
};

/**
 * 简单导出按钮（仅Excel）
 */
export const SimpleExportButton: React.FC<Omit<ExportButtonProps, 'buttonText'>> = (props) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      if (!props.data || props.data.length === 0) {
        message.warning('没有可导出的数据');
        return;
      }

      const processedData = props.dataProcessor ? props.dataProcessor(props.data) : props.data;
      const exportData: ExportData = {
        data: processedData,
        filename: props.filename,
        sheetName: props.sheetName || 'Sheet1'
      };

      exportToExcel(exportData);
      message.success('文件导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type={props.type || 'default'}
      size={props.size || 'middle'}
      icon={<FileExcelOutlined />}
      loading={loading}
      disabled={props.disabled}
      onClick={handleExport}
    >
      导出Excel
    </Button>
  );
};

export default ExportButton; 