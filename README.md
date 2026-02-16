# ASK Timer - Coworking Space Management System 🚀

**ASK Timer** is a modern, real-time management dashboard designed for coworking spaces. It streamlines user tracking, session management, and automated billing in dual currencies (SYP & USD).

Built with **React**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## ✨ Key Features

- **User Management:** Easily add, update, and delete users.
- **Real-time Session Tracking:** Start and stop sessions with a live timer.
- **Dual Currency Billing:** - Automatically calculates costs in **SYP** (Syrian Pounds) and **USD**.
  - Supports custom hourly rates.
- **Subscription System:** - Manage **Weekly** and **Monthly** subscriptions.
  - "Prepaid" status detection for active subscribers.
- **Financial Dashboard:** - View daily income split by currency (Cash vs. Subscriptions).
  - Track active sessions and total users.
- **Secure Authentication:** Protected admin access via Supabase Auth.
- **Responsive Design:** Dark mode UI optimized for all screens using `shadcn/ui`.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management:** TanStack Query (React Query)
- **Backend & Database:** Supabase (PostgreSQL)
- **Deployment:** GitHub Pages

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone [https://github.com/Kahfazan-Dv/ASK-Timer.git](https://github.com/Kahfazan-Dv/ASK-Timer.git)
cd ASK-Timer
```
### 2. Install dependencies

Bash :
npm install

### 3. Set up Environment Variables

Create a .env file in the root directory and add your Supabase credentials:
Code Snippet :
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

### 4. Run the development server

Bash :
npm run dev

## 🗄️ Database Schema (Supabase)

-- 1. Create Users Table
create table public.coworking_users (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  hour_balance numeric default 0,
  subscription_expiry timestamp with time zone
);

-- 2. Create Sessions Table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.coworking_users(id) on delete cascade not null,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  duration_hours numeric,
  cost_syp numeric,
  cost_usd numeric,
  payment_method text,
  deducted_from_balance boolean default false
);

-- 3. Create Balance Transactions Table
create table public.balance_transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.coworking_users(id) on delete cascade not null,
  hours_added numeric default 0,
  amount_paid numeric default 0,
  currency text default 'USD'
);
