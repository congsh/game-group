/**
 * 通用图表包装组件
 * 基于ECharts的React图表组件封装
 */

import React, { useEffect, useRef } from 'react';
import { Card, Typography } from 'antd';
import * as echarts from 'echarts';

const { Title } = Typography;

/**
 * 图表配置接口
 */
export interface ChartConfig {
  /** 图表标题 */
  title: string;
  /** ECharts配置选项 */
  option: echarts.EChartsOption;
  /** 图表高度 */
  height?: number;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 额外的样式类名 */
  className?: string;
}

/**
 * 图表包装组件属性
 */
interface ChartWrapperProps extends ChartConfig {
  /** 卡片标题级别 */
  titleLevel?: 1 | 2 | 3 | 4 | 5;
  /** 是否显示边框 */
  bordered?: boolean;
}

/**
 * 图表包装组件
 */
export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  option,
  height = 400,
  loading = false,
  className = '',
  titleLevel = 4,
  bordered = true
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  /**
   * 初始化图表
   */
  useEffect(() => {
    if (chartRef.current) {
      // 销毁现有图表实例
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      // 创建新的图表实例
      chartInstanceRef.current = echarts.init(chartRef.current);
      
      // 设置图表配置
      chartInstanceRef.current.setOption(option);

      // 处理窗口大小变化
      const handleResize = () => {
        chartInstanceRef.current?.resize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstanceRef.current?.dispose();
      };
    }
  }, [option]);

  /**
   * 处理加载状态
   */
  useEffect(() => {
    if (chartInstanceRef.current) {
      if (loading) {
        chartInstanceRef.current.showLoading();
      } else {
        chartInstanceRef.current.hideLoading();
      }
    }
  }, [loading]);

  return (
    <Card 
      title={<Title level={titleLevel} style={{ margin: 0 }}>{title}</Title>}
      bordered={bordered}
      className={className}
    >
      <div
        ref={chartRef}
        style={{ 
          width: '100%', 
          height: height,
          minHeight: height 
        }}
      />
    </Card>
  );
};

/**
 * 柱状图配置生成器
 * @param data 数据数组
 * @param xField X轴字段名
 * @param yField Y轴字段名
 * @param title 图表标题
 * @returns ECharts配置
 */
export const createBarChartOption = (
  data: any[],
  xField: string,
  yField: string,
  title?: string
): echarts.EChartsOption => {
  return {
    title: title ? {
      text: title,
      left: 'center'
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xField]),
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'bar',
        data: data.map(item => item[yField]),
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  };
};

/**
 * 折线图配置生成器
 * @param data 数据数组
 * @param xField X轴字段名
 * @param yField Y轴字段名
 * @param title 图表标题
 * @returns ECharts配置
 */
export const createLineChartOption = (
  data: any[],
  xField: string,
  yField: string,
  title?: string
): echarts.EChartsOption => {
  return {
    title: title ? {
      text: title,
      left: 'center'
    } : undefined,
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xField])
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        type: 'line',
        data: data.map(item => item[yField]),
        smooth: true,
        itemStyle: {
          color: '#52c41a'
        },
        areaStyle: {
          color: 'rgba(82, 196, 26, 0.2)'
        }
      }
    ]
  };
};

/**
 * 饼图配置生成器
 * @param data 数据数组
 * @param nameField 名称字段
 * @param valueField 值字段
 * @param title 图表标题
 * @returns ECharts配置
 */
export const createPieChartOption = (
  data: any[],
  nameField: string,
  valueField: string,
  title?: string
): echarts.EChartsOption => {
  return {
    title: title ? {
      text: title,
      left: 'center'
    } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: title || '数据分布',
        type: 'pie',
        radius: '50%',
        data: data.map(item => ({
          name: item[nameField],
          value: item[valueField]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
};

/**
 * 多系列柱状图配置生成器
 * @param data 数据数组
 * @param xField X轴字段名
 * @param series 系列配置数组
 * @param title 图表标题
 * @returns ECharts配置
 */
export const createMultiBarChartOption = (
  data: any[],
  xField: string,
  series: Array<{ field: string; name: string; color?: string }>,
  title?: string
): echarts.EChartsOption => {
  return {
    title: title ? {
      text: title,
      left: 'center'
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: series.map(s => s.name)
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xField])
    },
    yAxis: {
      type: 'value'
    },
    series: series.map(s => ({
      name: s.name,
      type: 'bar',
      data: data.map(item => item[s.field]),
      itemStyle: {
        color: s.color || '#1890ff'
      }
    }))
  };
};

export default ChartWrapper; 