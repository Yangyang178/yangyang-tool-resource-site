# 域名配置指南

本文档详细介绍如何为工具资源站配置域名和DNS解析。

## 域名选择建议

### 推荐域名后缀
- `.com` - 最通用，用户信任度高
- `.cn` - 适合中国用户
- `.net` - 技术类网站常用
- `.org` - 非营利性质
- `.top` - 新兴后缀，价格便宜

### 域名命名建议
- 简短易记（建议10个字符以内）
- 与工具资源相关的关键词
- 避免使用连字符和数字
- 考虑品牌化和SEO友好

**示例域名**：
- `toolhub.com`
- `resourcekit.net`
- `devtools.top`
- `工具站.cn`

## 域名购买平台

### 国内平台
1. **阿里云（万网）**
   - 网址：https://wanwang.aliyun.com
   - 优势：服务稳定，支持中文域名
   - 价格：.com约55-65元/年

2. **腾讯云**
   - 网址：https://dnspod.cloud.tencent.com
   - 优势：与腾讯云服务集成好
   - 价格：.com约55-60元/年

3. **百度云**
   - 网址：https://cloud.baidu.com/product/bcd
   - 优势：百度生态集成
   - 价格：.com约50-60元/年

### 国外平台
1. **Namecheap**
   - 网址：https://www.namecheap.com
   - 优势：价格便宜，界面友好
   - 价格：.com约$8-12/年

2. **GoDaddy**
   - 网址：https://www.godaddy.com
   - 优势：全球最大域名注册商
   - 价格：.com约$12-15/年

3. **Cloudflare**
   - 网址：https://www.cloudflare.com
   - 优势：成本价销售，无额外费用
   - 价格：.com约$8.57/年

## DNS解析配置

### 基本DNS记录

假设你的服务器IP是 `123.456.789.012`，需要添加以下DNS记录：

```
记录类型  主机记录  记录值
A        @        123.456.789.012
A        www      123.456.789.012
CNAME    *        your-domain.com
```

### 详细配置步骤

#### 阿里云DNS配置
1. 登录阿里云控制台
2. 进入「域名与网站」→「云解析DNS」
3. 点击域名进入解析设置
4. 添加记录：
   - **A记录**：主机记录填`@`，记录值填服务器IP
   - **A记录**：主机记录填`www`，记录值填服务器IP
   - **CNAME记录**：主机记录填`*`，记录值填`your-domain.com`

#### 腾讯云DNS配置
1. 登录腾讯云控制台
2. 进入「域名与网站」→「DNS解析DNSPod」
3. 点击域名进入记录管理
4. 添加相同的A记录和CNAME记录

#### Cloudflare DNS配置
1. 登录Cloudflare控制台
2. 选择你的域名
3. 进入「DNS」选项卡
4. 添加记录（注意关闭橙色云朵代理，使用灰色云朵）

### 高级DNS配置

#### 子域名配置
如果需要配置子域名（如api.your-domain.com）：

```
记录类型  主机记录  记录值
A        api      123.456.789.012
A        admin    123.456.789.012
CNAME    cdn      your-domain.com
```

#### 邮箱配置（可选）
如果需要企业邮箱：

```
记录类型  主机记录  记录值                优先级
MX       @        mail.your-domain.com  10
A        mail     123.456.789.012
TXT      @        "v=spf1 include:_spf.your-domain.com ~all"
```

## DNS生效验证

### 使用命令行工具

```bash
# 检查A记录
nslookup your-domain.com
dig your-domain.com A

# 检查CNAME记录
nslookup www.your-domain.com
dig www.your-domain.com CNAME

# 检查所有记录
dig your-domain.com ANY
```

### 使用在线工具
- https://tool.chinaz.com/dns
- https://www.whatsmydns.net
- https://dnschecker.org

### 验证步骤
1. **ping测试**：`ping your-domain.com`
2. **HTTP访问**：`curl -I http://your-domain.com`
3. **全球DNS传播**：使用whatsmydns.net检查

## 常见问题解决

### DNS不生效
1. **等待时间**：DNS传播需要0-48小时
2. **清除缓存**：
   ```bash
   # Windows
   ipconfig /flushdns
   
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemctl restart systemd-resolved
   ```
3. **检查记录格式**：确保没有多余空格或特殊字符

### 域名解析错误
1. **检查NS记录**：确保使用正确的DNS服务器
2. **TTL设置**：新记录建议设置较短TTL（如300秒）
3. **记录冲突**：删除重复或冲突的DNS记录

### HTTPS访问问题
1. **SSL证书**：确保证书包含所有域名
2. **端口开放**：检查服务器443端口是否开放
3. **防火墙**：确保防火墙允许HTTPS流量

## 域名安全建议

### 域名保护
1. **启用域名锁定**：防止恶意转移
2. **设置域名隐私保护**：隐藏个人信息
3. **启用两步验证**：增强账户安全
4. **定期续费**：避免域名过期

### DNS安全
1. **使用DNSSEC**：防止DNS劫持
2. **监控DNS变化**：及时发现异常
3. **备份DNS配置**：记录所有DNS设置

## 配置检查清单

- [ ] 域名已购买并实名认证
- [ ] DNS服务器已配置
- [ ] A记录已添加（@ 和 www）
- [ ] CNAME记录已添加（可选）
- [ ] DNS解析已生效
- [ ] 域名可以正常访问
- [ ] 子域名配置正确（如需要）
- [ ] 邮箱记录配置（如需要）
- [ ] 域名安全设置已启用

## 下一步

域名配置完成后，请继续进行：
1. [SSL证书配置](./ssl-setup.md)
2. [生产环境部署](../DEPLOYMENT.md)
3. [监控系统配置](./monitoring-setup.md)

---

**提示**：建议先使用测试域名或子域名进行部署测试，确认一切正常后再切换到正式域名。