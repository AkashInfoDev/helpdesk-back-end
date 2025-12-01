# Phase 4 - Knowledge Base Management Flow

## 📋 Overview

Phase 4 implements a complete Knowledge Base system with categories, articles, rich content editor, versioning, search, feedback, and image uploads.

---

## 🎯 Objectives

- ✅ KB category management
- ✅ Article creation and management
- ✅ Rich content editor support
- ✅ Article versioning and history
- ✅ Article search functionality
- ✅ Article feedback (helpful/not helpful)
- ✅ Image uploads for articles
- ✅ Public/Private article visibility

---

## 🔄 Complete Knowledge Base Flow

### **1. KB Category Management**

#### **Get Active Categories (Public)**
```
GET /api/kb/categories/active
Headers: Authorization: Bearer <token>
```

**Response:** List of active categories visible to customers

#### **Get All Categories (Admin)**
```
GET /api/kb/categories
Headers: Authorization: Bearer <admin_token>
```

**Response:** All categories including inactive

#### **Create Category (Admin)**
```
POST /api/kb/categories
Headers: Authorization: Bearer <admin_token>
Body: {
    "name": "Getting Started",
    "description": "Getting started guides",
    "is_active": true
}
```

#### **Update Category (Admin)**
```
PUT /api/kb/categories/:id
Headers: Authorization: Bearer <admin_token>
Body: {
    "name": "Updated Name",
    "description": "Updated description",
    "is_active": true
}
```

#### **Delete Category (Admin)**
```
DELETE /api/kb/categories/:id
Headers: Authorization: Bearer <admin_token>
```

---

### **2. KB Article Management**

#### **Create Article (Admin)**
```
POST /api/kb/articles
Headers: Authorization: Bearer <admin_token>
Body: {
    "title": "How to Reset Password",
    "content": "<p>Follow these steps...</p>",
    "category_id": 1,
    "is_public": true,
    "tags": ["password", "reset"]
}
```

**Content Format:**
- HTML content (from Quill editor)
- Supports rich text, images, links
- Images should use uploaded image URLs

**Response:**
```json
{
  "message": "Article created successfully",
  "article": {
    "id": 1,
    "title": "How to Reset Password",
    "slug": "how-to-reset-password",
    "content": "...",
    "is_public": true,
    ...
  }
}
```

**Save `article.id` for subsequent requests!**

---

#### **Get Article by ID**
```
GET /api/kb/articles/:id
Headers: Authorization: Bearer <token>
```

**Visibility Rules:**
- Public articles: Visible to all
- Private articles: Only visible to agents/admins
- Customers: Only see public articles

---

#### **Update Article (Admin)**
```
PUT /api/kb/articles/:id
Headers: Authorization: Bearer <admin_token>
Body: {
    "title": "Updated Title",
    "content": "<p>Updated content...</p>",
    "is_public": true
}
```

**Versioning:**
- Creates new version in history
- Previous version is preserved
- Can view version history

---

#### **Delete Article (Admin)**
```
DELETE /api/kb/articles/:id
Headers: Authorization: Bearer <admin_token>
```

---

### **3. Article Search**

#### **Search Articles**
```
GET /api/kb/articles/search?q=login&category_id=1&is_public=true
Headers: Authorization: Bearer <token>
```

**Query Parameters:**
- `q` - Search query (required)
- `category_id` - Filter by category (optional)
- `is_public` - Filter public/private (optional)

**Response:**
```json
{
  "articles": [
    {
      "id": 1,
      "title": "How to Login",
      "content": "...",
      "category": {...},
      ...
    }
  ],
  "total": 1
}
```

**Search Rules:**
- Customers: Only see public articles
- Agents/Admins: See all articles (public + private)

---

### **4. Article Version History**

#### **Get Article History (Admin/Agent)**
```
GET /api/kb/articles/:id/history
Headers: Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "version": 1,
      "title": "Original Title",
      "content": "...",
      "created_at": "...",
      "created_by": {...}
    },
    {
      "id": 2,
      "version": 2,
      "title": "Updated Title",
      "content": "...",
      "created_at": "...",
      "created_by": {...}
    }
  ]
}
```

---

### **5. Article Feedback**

#### **Submit Feedback**
```
POST /api/kb/articles/:id/feedback
Headers: Authorization: Bearer <token>
Body: {
    "helpful": true,
    "comment": "This article was very helpful!"
}
```

**Feedback Types:**
- `helpful: true` - Article was helpful
- `helpful: false` - Article was not helpful
- `comment` - Optional feedback comment

**All roles can submit feedback!**

---

### **6. Image Upload**

#### **Upload KB Image (Admin)**
```
POST /api/kb/upload/image
Headers: Authorization: Bearer <admin_token>
Body: form-data
  - image: [select image file]
```

**Supported Formats:**
- JPEG, PNG, GIF, WebP
- Max size: 5MB

**Response:**
```json
{
  "url": "/uploads/kb/image-1234567890.jpg",
  "filename": "image-1234567890.jpg"
}
```

**Usage:**
- Use the returned URL in article content
- Example: `<img src="/uploads/kb/image-1234567890.jpg" />`

---

## 📝 Step-by-Step Testing Flow

### **Complete KB Article Lifecycle:**

1. **Admin Creates Category:**
   ```bash
   POST /api/kb/categories
   {
       "name": "Getting Started",
       "description": "Getting started guides",
       "is_active": true
   }
   ```
   - Save `category_id`

2. **Admin Uploads Image:**
   ```bash
   POST /api/kb/upload/image
   [Upload image file]
   ```
   - Save image URL from response

3. **Admin Creates Article:**
   ```bash
   POST /api/kb/articles
   {
       "title": "How to Reset Password",
       "content": "<p>Steps to reset:</p><img src=\"/uploads/kb/image-123.jpg\" />",
       "category_id": 1,
       "is_public": true,
       "tags": ["password", "reset"]
   }
   ```
   - Save `article_id`

4. **Customer Searches Articles:**
   ```bash
   GET /api/kb/articles/search?q=password
   ```

5. **Customer Views Article:**
   ```bash
   GET /api/kb/articles/:id
   ```

6. **Customer Submits Feedback:**
   ```bash
   POST /api/kb/articles/:id/feedback
   {
       "helpful": true,
       "comment": "Very helpful!"
   }
   ```

7. **Admin Updates Article:**
   ```bash
   PUT /api/kb/articles/:id
   {
       "title": "Updated Title",
       "content": "<p>Updated content...</p>"
   }
   ```
   - Creates new version

8. **Admin Views Version History:**
   ```bash
   GET /api/kb/articles/:id/history
   ```

---

## 🎯 Article Visibility

### **Public Articles (`is_public: true`)**
- Visible to all users (customers, agents, admins)
- Appear in customer search results
- Shown in customer KB portal

### **Private Articles (`is_public: false`)**
- Only visible to agents and admins
- Not shown to customers
- Useful for internal documentation

---

## 📊 Article Features

1. **Rich Content Editor**
   - HTML content support
   - Images, links, formatting
   - Quill editor compatible

2. **Versioning**
   - Automatic version creation on update
   - Full history tracking
   - Can view previous versions

3. **Search**
   - Full-text search
   - Category filtering
   - Public/private filtering

4. **Feedback**
   - Helpful/not helpful rating
   - Optional comments
   - Analytics tracking

5. **Tags**
   - Categorization
   - Search enhancement
   - Organization

---

## ✅ Success Criteria

- [ ] Categories can be created/updated/deleted
- [ ] Articles can be created with rich content
- [ ] Images can be uploaded
- [ ] Articles can be searched
- [ ] Version history works
- [ ] Feedback can be submitted
- [ ] Public/private visibility works
- [ ] Role-based access works

---

## 🔧 Environment Variables

**Image Upload:**
- Max file size: 5MB
- Storage: `uploads/kb/`
- Supported: JPEG, PNG, GIF, WebP

---

## 🚀 Next Phase

After Phase 4 is complete, proceed to:
- **Phase 5:** Live Chat & Real-time Communication

---

## 📋 Content Editor Integration

**For Quill Editor:**
1. Upload image: `POST /api/kb/upload/image`
2. Get image URL from response
3. Insert image URL in article content
4. Save article with HTML content

**Example Content:**
```html
<p>Follow these steps:</p>
<ol>
  <li>Step 1</li>
  <li>Step 2</li>
</ol>
<img src="/uploads/kb/image-123.jpg" alt="Screenshot" />
```

---

**Phase 4 provides a complete Knowledge Base system! ✅**

