import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  message,
  Space,
  Tag,
  Divider
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  LinkOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { resourceService } from '../services/resourceService';
import type { CreateResourceData } from '../services/resourceService';

const { TextArea } = Input;
const { Option } = Select;

interface UploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  categories: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
}

interface ToolFormData {
  title: string;
  description: string;
  category_id: number;
  download_url: string;
  download_password?: string;
  tags: string[];
  file_type: string;
  file_size?: number;
}

const UploadModal: React.FC<UploadModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  categories
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');

  // 处理文件上传
  const handleFileChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    
    // 限制只能上传一个文件
    newFileList = newFileList.slice(-1);
    
    // 只保留HTML文件
    newFileList = newFileList.filter(file => {
      if (file.type && !file.type.includes('html') && !file.name.endsWith('.html')) {
        message.error('只能上传HTML文件！');
        return false;
      }
      return true;
    });

    setFileList(newFileList);
    
    // 自动填充文件信息
    if (newFileList.length > 0) {
      const file = newFileList[0];
      form.setFieldsValue({
        file_type: 'html',
        file_size: file.size
      });
    }
  };

  // 添加标签
  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      const newTags = [...tags, inputTag];
      setTags(newTags);
      form.setFieldsValue({ tags: newTags });
      setInputTag('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setFieldsValue({ tags: newTags });
  };

  // 提交表单
  const handleSubmit = async (values: ToolFormData) => {
    if (fileList.length === 0) {
      message.error('请选择要上传的HTML文件！');
      return;
    }

    setLoading(true);
    
    try {
      console.log('开始上传工具...', values);
      
      // 构建提交数据
      const submitData: CreateResourceData = {
        title: values.title,
        description: values.description,
        category_id: values.category_id,
        download_url: values.download_url,
        download_password: values.download_password,
        file_type: 'html',
        file_size: fileList[0]?.size,
        tags: tags
      };

      console.log('提交数据:', submitData);
      
      // 调用API提交数据
      const response = await resourceService.createResource(submitData);
      
      console.log('API响应:', response);
      
      if (response.success) {
        message.success('工具上传成功！');
        handleReset();
        onSuccess();
      } else {
        console.error('上传失败:', response);
        message.error(response.message || '上传失败，请重试');
      }
    } catch (error) {
      console.error('上传异常:', error);
      if (error instanceof Error) {
        message.error(`上传失败: ${error.message}`);
      } else {
        message.error('上传失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setTags([]);
    setInputTag('');
  };

  // 取消操作
  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  return (
    <Modal
      title="上传工具"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          file_type: 'html',
          tags: []
        }}
      >
        {/* 文件上传 */}
        <Form.Item
          label="选择HTML文件"
          required
        >
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false} // 阻止自动上传
            accept=".html,.htm"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>
              选择HTML文件
            </Button>
          </Upload>
          <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
            支持上传HTML文件，用于预览和使用
          </div>
        </Form.Item>

        <Divider />

        {/* 工具信息 */}
        <Form.Item
          label="工具名称"
          name="title"
          rules={[{ required: true, message: '请输入工具名称' }]}
        >
          <Input placeholder="请输入工具名称" />
        </Form.Item>

        <Form.Item
          label="工具描述"
          name="description"
          rules={[{ required: true, message: '请输入工具描述' }]}
        >
          <TextArea
            rows={3}
            placeholder="请详细描述工具的功能和用途"
          />
        </Form.Item>

        <Form.Item
          label="工具分类"
          name="category_id"
          rules={[{ required: true, message: '请选择工具分类' }]}
        >
          <Select placeholder="请选择分类">
            {categories.map(category => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        {/* 网盘链接 */}
        <Form.Item
          label="网盘下载链接"
          name="download_url"
          rules={[
            { required: true, message: '请输入网盘下载链接' },
            { type: 'url', message: '请输入有效的网盘链接' }
          ]}
        >
          <Input
            prefix={<LinkOutlined />}
            placeholder="请输入百度网盘、阿里云盘等下载链接"
          />
        </Form.Item>

        <Form.Item
          label="提取码（如有）"
          name="download_password"
        >
          <Input placeholder="请输入网盘提取码" />
        </Form.Item>

        {/* 标签 */}
        <Form.Item label="工具标签">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              {tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  color="blue"
                >
                  {tag}
                </Tag>
              ))}
            </Space>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onPressEnter={handleAddTag}
                placeholder="输入标签后按回车添加"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTag}
                disabled={!inputTag}
              >
                添加
              </Button>
            </Space.Compact>
          </Space>
        </Form.Item>

        {/* 隐藏字段 */}
        <Form.Item name="file_type" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="file_size" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="tags" hidden>
          <Input />
        </Form.Item>

        {/* 提交按钮 */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              上传工具
            </Button>
            <Button
              onClick={handleCancel}
              size="large"
            >
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UploadModal;