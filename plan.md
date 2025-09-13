# Invoice Generator Website - Project Plan

## 🎯 Project Overview
Build a full-featured invoice generation system with:
- User authentication via Clerk
- Invoice data storage in Supabase
- Client-side PDF generation
- Dashboard for managing invoices
- Professional invoice templates

## 🏗️ Technology Stack
- **Frontend**: Next.js 14+ (App Router)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **PDF Generation**: react-pdf or jsPDF
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **State Management**: Zustand (if needed)
- **Date Handling**: date-fns
- **UI Components**: shadcn/ui

## 📁 Project Structure
```
invoice/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── invoices/
│   │   │   └── clients/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── invoice/
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── InvoicePreview.tsx
│   │   │   ├── InvoiceList.tsx
│   │   │   ├── InvoiceTable.tsx
│   │   │   └── InvoicePDF.tsx
│   │   ├── client/
│   │   │   ├── ClientForm.tsx
│   │   │   └── ClientSelect.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       └── (shadcn components)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── pdf/
│   │   │   ├── generator.ts
│   │   │   └── templates/
│   │   ├── utils/
│   │   │   ├── calculations.ts
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── invoice.ts
│   │   ├── client.ts
│   │   └── database.ts
│   └── middleware.ts
```

## 📊 Database Schema

### Tables Structure

#### 1. **user_profiles** (User Profile)
```sql
- id (uuid, primary key, references auth.users)
- business_name (text)
- business_email (text)
- business_phone (text)
- business_address (text)
- logo_url (text)
- default_currency (text, default 'USD')
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. **clients**
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users(id))
- name (text, not null)
- email (text)
- address (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. **invoices**
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users(id))
- buyer_name (text, not null)
- buyer_address (text)
- buyer_email (text)
- currency (text, not null)
- account_no (text)
- service_name (text, not null)
- unit_net_price (numeric(12,2), not null)
- vat_rate (numeric(5,2), not null, default 0)
- vat_amount (numeric(12,2), not null, default 0)
- total_gross_price (numeric(12,2), not null)
- qty (integer, default 1)
- payment_link (text)
- issued_at (timestamp, default now())
- due_date (date)
- status (text, default 'draft') -- draft, sent, paid, overdue
- created_at (timestamp, default now())
- updated_at (timestamp, default now())
```

### SQL CREATE TABLE Queries

Run these queries in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  business_email text,
  business_phone text,
  business_address text,
  logo_url text,
  default_currency text DEFAULT 'USD',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 2. Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  address text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 3. Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_address text,
  buyer_email text,
  currency text NOT NULL,
  account_no text,
  service_name text NOT NULL,
  unit_net_price numeric(12,2) NOT NULL,
  vat_rate numeric(5,2) NOT NULL DEFAULT 0,
  vat_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_gross_price numeric(12,2) NOT NULL,
  qty integer DEFAULT 1,
  payment_link text,
  issued_at timestamp DEFAULT now(),
  due_date date,
  status text DEFAULT 'draft',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clients Policies
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Invoices Policies
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);
```

### Database Functions

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid uuid)
RETURNS text AS $$
DECLARE
  invoice_count integer;
  invoice_number text;
BEGIN
  -- Get count of invoices for this user
  SELECT COUNT(*) + 1 INTO invoice_count
  FROM invoices
  WHERE user_id = user_uuid;
  
  -- Generate invoice number (INV-YYYY-NNNN format)
  invoice_number := 'INV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(invoice_count::text, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 Implementation Steps

### Phase 1: Project Setup (Day 1)
1. **Initialize Next.js project**
   ```bash
   npx create-next-app@latest invoice --typescript --tailwind --app
   ```

2. **Install dependencies**
   ```bash
   npm install @clerk/nextjs @supabase/supabase-js
   npm install react-pdf @react-pdf/renderer
   npm install react-hook-form zod @hookform/resolvers
   npm install date-fns
   npm install lucide-react
   ```

3. **Setup environment variables**
   ```env
   # .env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

4. **Configure Clerk authentication**
   - Setup Clerk provider in layout
   - Create middleware for protected routes
   - Configure sign-in/sign-up pages

5. **Setup Supabase**
   - Create Supabase project
   - Setup database schema
   - Configure Row Level Security (RLS)
   - Create database types

### Phase 2: Database & Backend (Day 2)
1. **Create Supabase tables**
   - Run migrations for all tables
   - Setup RLS policies
   - Create database functions for invoice numbering

2. **Setup API routes**
   - Invoice CRUD operations
   - Client management
   - Dashboard statistics

3. **Create data access layer**
   - Supabase client configuration
   - Database query functions
   - Error handling utilities

### Phase 3: Core Features - Invoice Form (Day 3-4)
1. **Build Invoice Form Component**
   - Business details section
   - Client selection/creation
   - Invoice details (number, dates)
   - Line items with dynamic add/remove
   - Tax and discount calculations
   - Notes and terms

2. **Implement form validation**
   - Zod schemas
   - Field-level validation
   - Form submission handling

3. **Create calculation utilities**
   - Subtotal calculation
   - Tax calculation
   - Discount application
   - Total calculation

### Phase 4: PDF Generation (Day 5)
1. **Design invoice templates**
   - Professional layout
   - Company branding
   - Multiple template options

2. **Implement PDF generator**
   - React-PDF components
   - Dynamic data binding
   - Download functionality
   - Email attachment preparation

3. **Preview functionality**
   - Live preview as user types
   - Template switching
   - Print preview

### Phase 5: Dashboard & Invoice Management (Day 6-7)
1. **Create Dashboard**
   - Statistics cards (total invoices, paid, pending, overdue)
   - Recent invoices list
   - Revenue charts
   - Quick actions

2. **Invoice List/Table**
   - Sortable columns
   - Filter by status
   - Search functionality
   - Pagination
   - Bulk actions

3. **Invoice Actions**
   - View invoice
   - Edit invoice
   - Duplicate invoice
   - Delete invoice
   - Mark as paid/sent
   - Send via email

### Phase 6: Client Management (Day 8)
1. **Client CRUD operations**
   - Add new client
   - Edit client details
   - Client list/table
   - Client invoice history

2. **Client selection in invoice**
   - Searchable dropdown
   - Quick add new client
   - Auto-fill client details

### Phase 7: User Settings & Profile (Day 9)
1. **Business Profile Settings**
   - Company information
   - Logo upload
   - Default tax rate
   - Invoice numbering format
   - Default payment terms

2. **Invoice Settings**
   - Default template selection
   - Custom fields
   - Email templates
   - Currency settings

### Phase 8: Advanced Features (Day 10-11)
1. **Recurring Invoices**
   - Setup recurring schedules
   - Auto-generation
   - Notification system

2. **Payment Integration (Optional)**
   - Stripe/PayPal integration
   - Payment links
   - Payment tracking

3. **Email Integration**
   - Send invoice via email
   - Email templates
   - Delivery tracking

4. **Export Features**
   - Export to CSV
   - Bulk PDF download
   - Financial reports

### Phase 9: UI/UX Polish (Day 12)
1. **Responsive Design**
   - Mobile optimization
   - Tablet views
   - Print styles

2. **Loading States**
   - Skeleton loaders
   - Progress indicators
   - Optimistic updates

3. **Error Handling**
   - User-friendly error messages
   - Retry mechanisms
   - Offline support

### Phase 10: Testing & Deployment (Day 13-14)
1. **Testing**
   - Unit tests for calculations
   - Integration tests
   - E2E tests for critical flows

2. **Performance Optimization**
   - Image optimization
   - Code splitting
   - Caching strategies

3. **Deployment**
   - Vercel deployment
   - Environment configuration
   - Domain setup
   - SSL configuration

## 🎨 UI/UX Considerations
- Clean, professional interface
- Intuitive navigation
- Mobile-responsive design
- Accessibility compliance
- Dark mode support
- Keyboard shortcuts
- Auto-save functionality
- Undo/Redo support

## 🔒 Security Considerations
- Row Level Security in Supabase
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- Secure file uploads
- Data encryption

## 📈 Future Enhancements
- Multi-language support
- Multi-currency with conversion
- Team collaboration
- API for third-party integrations
- Mobile app
- Advanced reporting
- Inventory management
- Time tracking integration
- Expense tracking
- Quotes/Estimates feature

## 🏁 Success Metrics
- User can create account and login
- User can create, edit, delete invoices
- User can generate PDF invoices
- User can manage clients
- Invoice calculations are accurate
- PDF generation works on all devices
- Search and filter functionality works
- Dashboard shows accurate statistics

## 📝 Development Notes
- Use TypeScript for type safety
- Follow Next.js best practices
- Implement proper error boundaries
- Use React.memo for performance
- Implement proper SEO
- Add analytics tracking
- Create comprehensive documentation