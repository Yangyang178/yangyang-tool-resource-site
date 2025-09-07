import React, { useState, useEffect } from 'react';
import './EditToolModal.css';

interface Tool {
  id: number;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  url?: string;
  download_url?: string;
  download_count?: number;
  file_type?: string;
  file_size?: number;
  download_password?: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  count: number;
}

interface EditToolModalProps {
  visible: boolean;
  tool: Tool | null;
  categories: Category[];
  onCancel: () => void;
  onSuccess: (updatedTool: Tool) => void;
}

const EditToolModal: React.FC<EditToolModalProps> = ({
  visible,
  tool,
  categories,
  onCancel,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: 0,
    download_url: '',
    download_password: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 当工具数据变化时更新表单
  useEffect(() => {
    if (tool && visible) {
      const categoryId = categories.find(cat => cat.name === tool.category)?.id || 0;
      setFormData({
        title: tool.name || '',
        description: tool.description || '',
        category_id: categoryId,
        download_url: tool.download_url || '',
        download_password: tool.download_password || '',
        tags: tool.tags?.join(', ') || ''
      });
      setErrors({});
    }
  }, [tool, visible]);

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = '工具名称不能为空';
    }

    if (!formData.description.trim()) {
      newErrors.description = '工具描述不能为空';
    }

    if (formData.category_id === 0) {
      newErrors.category_id = '请选择工具分类';
    }

    if (!formData.download_url.trim()) {
      newErrors.download_url = '下载链接不能为空';
    } else if (!/^https?:\/\/.+/.test(formData.download_url)) {
      newErrors.download_url = '请输入有效的下载链接';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!tool) return;

    setLoading(true);
    
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        download_url: formData.download_url.trim(),
        download_password: formData.download_password.trim() || null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).join(',')
      };

      const response = await fetch(`http://localhost:3001/api/resources/${tool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        // 构造更新后的工具对象
        const updatedTool: Tool = {
          ...tool,
          name: updateData.title,
          description: updateData.description,
          category: categories.find(cat => cat.id === updateData.category_id)?.name || tool.category,
          download_url: updateData.download_url,
          download_password: updateData.download_password || undefined,
          tags: updateData.tags ? updateData.tags.split(',') : []
        };
        
        onSuccess(updatedTool);
      } else {
        alert(result.message || '更新失败，请重试');
      }
    } catch (error) {
      console.error('更新工具失败:', error);
      alert('更新失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="edit-modal-overlay" onClick={onCancel}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>编辑工具</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">工具名称 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="请输入工具名称"
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">工具描述 *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="请输入工具描述"
              rows={3}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category_id">工具分类 *</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className={errors.category_id ? 'error' : ''}
            >
              <option value={0}>请选择分类</option>
              {categories.filter(cat => cat.id !== 0).map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <span className="error-message">{errors.category_id}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="download_url">下载链接 *</label>
            <input
              type="url"
              id="download_url"
              name="download_url"
              value={formData.download_url}
              onChange={handleInputChange}
              className={errors.download_url ? 'error' : ''}
              placeholder="https://example.com/download"
            />
            {errors.download_url && <span className="error-message">{errors.download_url}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="download_password">提取码</label>
            <input
              type="text"
              id="download_password"
              name="download_password"
              value={formData.download_password}
              onChange={handleInputChange}
              placeholder="可选，网盘提取码"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">标签</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="多个标签用逗号分隔，如：AI, 工具, 效率"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '更新中...' : '确认更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditToolModal;