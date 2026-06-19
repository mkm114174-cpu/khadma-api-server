--
-- PostgreSQL database dump
--

\restrict uvQxg0B6EOeb2gksOp6m2kZA5qhDZKR5rEn0yHLRkPfW3Ss37dl0OpagVb3hkXu

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    request_id integer NOT NULL,
    provider_id integer NOT NULL,
    sender_id integer NOT NULL,
    body text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: commission_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_ledger (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    request_id integer,
    type text NOT NULL,
    amount integer NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT commission_ledger_amount_check CHECK ((amount > 0)),
    CONSTRAINT commission_ledger_type_check CHECK ((type = ANY (ARRAY['commission'::text, 'settlement'::text])))
);


--
-- Name: commission_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commission_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commission_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commission_ledger_id_seq OWNED BY public.commission_ledger.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    user_id integer,
    name text NOT NULL,
    email text,
    subject text,
    message text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    reply text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    body text,
    type text,
    is_read boolean DEFAULT false NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id integer NOT NULL,
    request_id integer NOT NULL,
    provider_id integer NOT NULL,
    price integer NOT NULL,
    message text,
    available_time timestamp with time zone,
    estimated_duration text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offers_id_seq OWNED BY public.offers.id;


--
-- Name: provider_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_skills (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    skill_id integer NOT NULL,
    experience_years integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: provider_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_skills_id_seq OWNED BY public.provider_skills.id;


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    service_type text NOT NULL,
    bio text,
    phone text,
    status text DEFAULT 'pending'::text NOT NULL,
    rating real DEFAULT 0 NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    lat double precision,
    lng double precision,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    available_from text,
    available_to text,
    experience_years integer,
    city text,
    address_text text,
    doc_osek_patur_path text,
    doc_osek_murshe_path text,
    doc_id_path text,
    review_note text,
    review_requested_at timestamp with time zone
);


--
-- Name: providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;


--
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id integer NOT NULL,
    request_number text NOT NULL,
    user_id integer NOT NULL,
    provider_id integer,
    service_type text,
    description text,
    image_url text,
    lat double precision,
    lng double precision,
    address text,
    status text DEFAULT 'pending'::text NOT NULL,
    price_min integer,
    price_max integer,
    preferred_time timestamp with time zone,
    scheduled_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_method text,
    skill_id integer,
    video_url text,
    includes_spare_parts boolean DEFAULT false NOT NULL
);


--
-- Name: requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    request_id integer NOT NULL,
    provider_id integer NOT NULL,
    user_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    category text,
    icon text,
    color text,
    type text DEFAULT 'built_in'::text NOT NULL,
    created_by_user_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name_en text,
    name_he text,
    description text,
    description_en text,
    description_he text,
    image text,
    status text DEFAULT 'approved'::text NOT NULL
);


--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    clerk_user_id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    role text DEFAULT 'customer'::text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    address text,
    lat double precision,
    lng double precision,
    last_seen_at timestamp with time zone,
    commission_agreed_at timestamp with time zone,
    language text DEFAULT 'ar'::text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: commission_ledger id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_ledger ALTER COLUMN id SET DEFAULT nextval('public.commission_ledger_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: offers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);


--
-- Name: provider_skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_skills ALTER COLUMN id SET DEFAULT nextval('public.provider_skills_id_seq'::regclass);


--
-- Name: providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);


--
-- Name: requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, request_id, provider_id, sender_id, body, is_read, created_at) FROM stdin;
1	10	6	43	مرحبا	t	2026-06-15 23:36:06.667995+00
\.


--
-- Data for Name: commission_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commission_ledger (id, provider_id, request_id, type, amount, note, created_at) FROM stdin;
1	6	10	commission	70	عمولة الطلب KH-00010	2026-06-16 17:13:39.13454+00
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_messages (id, user_id, name, email, subject, message, status, reply, created_at, updated_at) FROM stdin;
4	\N	زائر تجريبي	\N	\N	رسالة اختبار من زائر بدون تسجيل	resolved	\N	2026-06-18 17:16:17.011502+00	2026-06-18 23:37:24.681+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, body, type, is_read, data, created_at) FROM stdin;
1	8	عرض جديد	تلقيت عرضاً جديداً على طلبك KH-00006	offer	t	{"offerId": 4, "requestId": 6}	2026-06-15 22:13:10.82596+00
2	43	تم قبول عرضك	تم قبول عرضك على الطلب KH-00006	offer_accepted	f	{"offerId": 4, "requestId": 6}	2026-06-15 22:14:52.017907+00
3	8	تحديث الطلب	تم تحديث حالة طلبك KH-00006	request_update	t	{"status": "completed", "requestId": 6}	2026-06-15 22:14:56.424692+00
4	43	طلب جديد	وصلك طلب جديد: مكافحة حشرات	request_new	f	{"requestId": 7}	2026-06-15 23:03:29.789597+00
5	43	طلب جديد	وصلك طلب جديد: مكافحة حشرات	request_new	f	{"requestId": 8}	2026-06-15 23:03:59.56329+00
7	43	تم قبول عرضك	تم قبول عرضك على الطلب KH-00008	offer_accepted	f	{"offerId": 5, "requestId": 8}	2026-06-15 23:28:23.595151+00
10	43	طلب جديد	وصلك طلب جديد: مكافحة حشرات	request_new	f	{"requestId": 9}	2026-06-15 23:30:26.854588+00
11	43	طلب جديد	وصلك طلب جديد: مكافحة حشرات	request_new	f	{"requestId": 10}	2026-06-15 23:32:07.454752+00
13	43	تم قبول عرضك	تم قبول عرضك على الطلب KH-00010	offer_accepted	f	{"offerId": 6, "requestId": 10}	2026-06-15 23:34:27.415875+00
15	8	بدأ التنفيذ	بدأ مقدم الخدمة بتنفيذ طلبك KH-00010	request_started	t	{"status": "in_progress", "requestId": 10}	2026-06-15 23:36:20.85853+00
12	8	عرض جديد	تلقيت عرضاً جديداً على طلبك KH-00010	offer	t	{"offerId": 6, "requestId": 10}	2026-06-15 23:33:34.377412+00
9	8	تم إكمال الطلب	تم إكمال طلبك KH-00008	request_completed	t	{"status": "completed", "requestId": 8}	2026-06-15 23:29:38.416749+00
14	8	رسالة جديدة	مرحبا	chat_message	t	{"requestId": 10, "providerId": 6}	2026-06-15 23:36:06.675586+00
8	8	بدأ التنفيذ	بدأ مقدم الخدمة بتنفيذ طلبك KH-00008	request_started	t	{"status": "in_progress", "requestId": 8}	2026-06-15 23:29:02.993111+00
6	8	عرض جديد	تلقيت عرضاً جديداً على طلبك KH-00008	offer	t	{"offerId": 5, "requestId": 8}	2026-06-15 23:27:07.892518+00
16	43	طلب جديد	وصلك طلب جديد: مكافحة حشرات	request_new	f	{"requestId": 11}	2026-06-16 10:55:54.770744+00
17	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 13:31:50.134362+00
18	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 13:31:50.174803+00
19	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 13:36:46.949425+00
20	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 13:36:46.986084+00
21	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 13:46:10.341894+00
22	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 13:46:10.37807+00
23	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 13:56:10.346909+00
24	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 13:56:10.385154+00
25	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 14:06:10.776548+00
26	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 14:06:11.530232+00
27	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 14:16:10.447166+00
28	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 14:16:10.48916+00
29	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 14:26:10.532379+00
30	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 14:26:10.570505+00
31	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 14:36:10.613142+00
32	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 14:36:10.649738+00
33	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 14:46:10.647992+00
34	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 14:46:10.694474+00
35	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 14:56:10.660922+00
36	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 14:56:10.698145+00
37	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 15:06:10.727651+00
38	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 15:06:10.745929+00
39	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 15:16:10.832515+00
40	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 15:16:10.872009+00
41	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 15:26:10.890767+00
42	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 15:26:10.930136+00
43	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 15:36:11.155732+00
44	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 15:36:11.201671+00
45	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 15:46:11.214802+00
46	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 15:46:11.250267+00
47	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 15:56:11.230553+00
48	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 15:56:11.246583+00
49	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 16:06:11.272774+00
50	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 16:06:11.308416+00
51	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 16:13:16.010783+00
52	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 16:13:16.04914+00
53	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 16:23:16.014925+00
54	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 16:23:16.216299+00
55	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 16:33:16.019245+00
56	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 16:33:16.064651+00
57	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 16:43:16.044055+00
58	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 16:43:16.079451+00
59	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 16:47:41.194159+00
60	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 16:47:41.206369+00
61	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 16:57:41.229776+00
62	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 16:57:41.27541+00
63	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 9, "reassigned": true}	2026-06-16 17:07:41.255288+00
64	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً: مكافحة حشرات	request_reassigned	f	{"requestId": 11, "reassigned": true}	2026-06-16 17:07:41.293249+00
65	8	تم إكمال الطلب	تم إكمال طلبك KH-00010	request_completed	t	{"status": "completed", "requestId": 10}	2026-06-16 17:13:39.150955+00
66	43	طلب جديد	وصلك طلب جديد: مكافحة حشرات	request_new	f	{"requestId": 16}	2026-06-18 22:20:20.391728+00
67	43	طلب جديد	وصلك طلب جديد: مكافحة حشرات	request_new	f	{"requestId": 17}	2026-06-18 22:20:20.391728+00
68	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 22:20:50.56751+00
69	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 22:20:50.572433+00
70	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 22:30:50.588534+00
71	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 22:30:50.596109+00
72	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 22:40:50.602101+00
73	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 22:40:50.617616+00
74	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 22:50:50.64652+00
75	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 22:50:50.653761+00
76	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 23:00:50.670469+00
77	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 23:00:50.710825+00
78	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 23:09:25.377651+00
79	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 23:09:25.392332+00
80	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 23:19:25.363289+00
81	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 23:19:25.392018+00
82	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 23:29:25.383149+00
83	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 23:29:25.431933+00
84	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 23:39:25.402109+00
85	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 23:39:25.441255+00
117	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 23:41:14.042894+00
118	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 23:41:14.116544+00
119	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-18 23:51:13.962996+00
120	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-18 23:51:14.004827+00
121	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-19 00:01:13.989523+00
122	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-19 00:01:14.033391+00
123	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-19 00:11:13.974018+00
124	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-19 00:11:13.982507+00
156	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 16, "reassigned": true}	2026-06-19 07:47:26.011795+00
157	43	طلب بانتظار مزود	طلب لم يُقبل بعد ويحتاج مزوداً	request_reassigned	f	{"requestId": 17, "reassigned": true}	2026-06-19 07:47:26.060774+00
\.


--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offers (id, request_id, provider_id, price, message, available_time, estimated_duration, status, created_at, updated_at) FROM stdin;
4	6	6	250	الاتصال بي	2026-06-15 22:13:06.611+00	\N	accepted	2026-06-15 22:13:10.775827+00	2026-06-15 22:14:51.973+00
5	8	6	200	\N	2026-06-15 23:27:03.719+00	\N	accepted	2026-06-15 23:27:07.885552+00	2026-06-15 23:28:23.554+00
6	10	6	700	\N	2026-06-15 23:33:30.212+00	\N	accepted	2026-06-15 23:33:34.344646+00	2026-06-15 23:34:27.402+00
\.


--
-- Data for Name: provider_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.provider_skills (id, provider_id, skill_id, experience_years, created_at) FROM stdin;
2	6	20	\N	2026-06-18 22:20:05.945599+00
\.


--
-- Data for Name: providers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.providers (id, user_id, service_type, bio, phone, status, rating, rating_count, is_available, lat, lng, created_at, updated_at, available_from, available_to, experience_years, city, address_text, doc_osek_patur_path, doc_osek_murshe_path, doc_id_path, review_note, review_requested_at) FROM stdin;
5	42	نقل أثاث	خبره جيده	0559300261	rejected	0	0	t	\N	\N	2026-06-15 21:11:14.250402+00	2026-06-15 21:12:33.532+00	\N	\N	3	\N	\N	\N	\N	\N	\N	\N
6	43	مكافحة حشرات	خبره جيدا ولدي معدات للعمل ارجوى منكم القبول	0559300261	approved	3	1	t	32.810810810810814	35.18003663952892	2026-06-15 21:17:02.601227+00	2026-06-18 21:39:02.65+00	\N	\N	4	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.requests (id, request_number, user_id, provider_id, service_type, description, image_url, lat, lng, address, status, price_min, price_max, preferred_time, scheduled_time, created_at, updated_at, payment_method, skill_id, video_url, includes_spare_parts) FROM stdin;
10	KH-00010	8	6	مكافحة حشرات	تنظيف	\N	32.810810810810814	35.18003663952892	\N	completed	700	700	2026-06-15 23:32:03.272+00	\N	2026-06-15 23:32:07.404595+00	2026-06-16 17:13:39.031+00	\N	20	\N	f
9	KH-00009	8	\N	مكافحة حشرات	\N	\N	\N	\N	\N	cancelled	\N	\N	2026-06-15 23:30:22.636+00	\N	2026-06-15 23:30:26.846776+00	2026-06-16 17:09:10.534+00	\N	20	\N	f
11	KH-00011	8	\N	مكافحة حشرات	تنظيف	/objects/uploads/89a57e57-45c6-48da-af27-ffc2dfe710a3	32.810810810810814	35.18003663952892	\N	cancelled	500	20	2026-06-16 10:55:51.087+00	\N	2026-06-16 10:55:54.659137+00	2026-06-16 17:09:03.803+00	\N	20	\N	f
8	KH-00008	8	6	مكافحة حشرات	\N	\N	\N	\N	\N	completed	200	200	2026-06-15 23:03:55.385+00	\N	2026-06-15 23:03:59.540129+00	2026-06-15 23:29:38.383+00	\N	20	\N	f
7	KH-00007	8	\N	مكافحة حشرات	\N	\N	\N	\N	\N	cancelled	\N	\N	2026-06-15 23:03:25.585+00	\N	2026-06-15 23:03:29.742228+00	2026-06-15 23:03:38.18+00	\N	20	\N	f
6	KH-00006	8	6	مكافحة حشرات	تنظيف الطاوله	\N	\N	\N	شفاعمرو	completed	250	250	2026-06-15 22:10:40.385+00	\N	2026-06-15 22:10:44.186178+00	2026-06-15 22:14:56.42+00	\N	20	\N	f
16	KH-00016	8	\N	\N	اه	/objects/uploads/96cdf2d7-9c32-468b-a1ec-a04b567990f9	\N	\N	الشمال	pending	\N	\N	2026-06-18 21:48:08.226+00	\N	2026-06-18 21:48:13.365147+00	2026-06-18 21:48:13.37+00	on_site	20	\N	t
17	KH-00017	8	\N	\N	اه	/objects/uploads/116968d7-b130-436f-8b97-6f26dffb9ecb	\N	\N	الشمال	pending	\N	\N	2026-06-20 06:00:00+00	\N	2026-06-18 22:15:25.183975+00	2026-06-18 22:15:25.217+00	on_site	20	\N	t
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, request_id, provider_id, user_id, rating, comment, created_at) FROM stdin;
1	6	6	8	3	\N	2026-06-15 22:15:07.053609+00
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skills (id, name, slug, category, icon, color, type, created_by_user_id, created_at, name_en, name_he, description, description_en, description_he, image, status) FROM stdin;
1	قص شعر	haircut	beauty	scissors	#FF6B9D	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
2	مكياج كامل	makeup	beauty	star	#FF6B9D	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
3	مانيكير وبديكير	manicure-pedicure	beauty	droplet	#FF6B9D	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
4	علاج الوجه	facial-treatment	beauty	sun	#FF6B9D	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
9	تنظيف المنزل	home-cleaning	home	home	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
10	خدمة طهي	cooking-service	home	coffee	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
11	رعاية أطفال	childcare	home	smile	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
12	رعاية كبار السن	elderly-care	home	heart	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
13	سباكة	plumbing	maintenance	tool	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
14	كهرباء	electrical	maintenance	zap	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
15	صيانة تكييف	ac-maintenance	maintenance	wind	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
16	دهانات	painting	maintenance	edit	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
17	صانع كعك منزلي	home-baker	home	gift	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
18	حلويات منزلية	home-sweets	home	coffee	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
19	تنظيف سجاد وكنب	carpet-sofa-cleaning	home	grid	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
20	مكافحة حشرات	pest-control	home	shield	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
21	تنسيق وصيانة حدائق	gardening	home	sun	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
22	نقل أثاث	furniture-moving	home	truck	#2196F3	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
23	تصليح غسالات	washing-machine-repair	maintenance	refresh-cw	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
24	تصليح ثلاجات وبرّادات	refrigerator-repair	maintenance	thermometer	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
25	تصليح أفران ومايكروويف	oven-microwave-repair	maintenance	zap	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
26	تصليح غسالة صحون	dishwasher-repair	maintenance	droplet	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
27	نجارة وتركيب أثاث	carpentry-furniture	maintenance	tool	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
28	تركيب ستائر وإكسسوارات	curtains-accessories	maintenance	sliders	#FF9800	built_in	\N	2026-06-17 13:19:47.238513+00	\N	\N	\N	\N	\N	\N	approved
29	مكيف	مكيف	\N	\N	\N	custom	46	2026-06-17 14:29:35.874862+00	\N	\N	\N	\N	\N	\N	pending
30	بلاط	بلاط	\N	\N	\N	custom	46	2026-06-17 14:29:50.622087+00	\N	\N	\N	\N	\N	\N	pending
55	خدمات أخرى	other-general	other	more-horizontal	#9C27B0	built_in	\N	2026-06-18 21:23:50.221297+00	Other services	שירותים אחרים	\N	\N	\N	\N	approved
56	خدمات السيارات	car-services	maintenance	settings	#FF9800	built_in	\N	2026-06-18 22:05:39.581723+00	Car Services	שירותי רכב	\N	\N	\N	\N	approved
57	صيانة البيوت	home-maintenance	maintenance	home	#FF9800	built_in	\N	2026-06-18 22:42:19.159444+00	Home Maintenance	תחזוקת בתים	\N	\N	\N	\N	approved
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, clerk_user_id, name, email, phone, role, avatar_url, created_at, updated_at, address, lat, lng, last_seen_at, commission_agreed_at, language) FROM stdin;
42	user_3FBoTpUIeg6SJ4yfKxBjexFn5eb	jewelry2024 jewelry	jewelryjewelry40@gmail.com	\N	provider	\N	2026-06-15 21:10:37.875145+00	2026-06-15 21:10:37.875145+00	\N	\N	\N	\N	\N	ar
44	user_3FC2NwDbfS0oDXWUjh67rkd4SKT	Mmm Mmm	mhmd.1992.1992.1992.m@gmail.com	\N	provider	\N	2026-06-15 23:04:56.78041+00	2026-06-15 23:04:56.78041+00	\N	\N	\N	\N	\N	ar
47	user_3FGVVyrBc0pua621qA2nlnVXCcU	Mmmm	mhmad.1992.mmm.1992@gmail.com	\N	provider	\N	2026-06-17 13:03:52.176573+00	2026-06-18 11:03:42.832+00	\N	\N	\N	2026-06-18 11:03:42.832+00	\N	ar
46	user_3FG8c4zjdiFTwNXHwfnxGw4re1K	Zero Ship	zeroship664@gmail.com	\N	provider	\N	2026-06-17 09:55:39.956646+00	2026-06-17 09:55:39.956646+00	\N	\N	\N	\N	\N	ar
9	user_3FBhIYqWGGkzXWNyi3GtqETItLE	Mmm Mmm	mhmd.1992.1992.mmmmm@gmail.com	\N	provider	\N	2026-06-15 20:11:36.947016+00	2026-06-18 17:04:23+00	\N	\N	\N	2026-06-18 17:04:23+00	\N	ar
43	user_3FBp9E26ygXVBHh6YZdeby3HpD6	Mm Mmm	mhmd1992m199.m@gmail.com	0559300261	provider	\N	2026-06-15 21:16:06.794172+00	2026-06-18 22:18:51.802+00	\N	32.810810810810814	35.18003663952892	2026-06-18 22:18:51.802+00	\N	ar
1	user_3FB0xo2X503nkmIpusfuPy4o5IG	mh mk	mkm114174@gmail.com	\N	admin	\N	2026-06-15 14:23:35.266483+00	2026-06-17 23:28:58.567+00	\N	\N	\N	2026-06-17 23:28:58.566+00	\N	ar
45	user_3FDmUfNJioub2qCaoFtg7Gi5cOr	Support Freeboxshopping	freeboxshoppings@gmail.com	\N	provider	\N	2026-06-16 13:54:56.668128+00	2026-06-18 15:05:17.981+00	\N	\N	\N	2026-06-18 15:05:17.981+00	\N	ar
8	user_3FBgX8PxTVqV32TQzcfAUq9gLia	M M	mhmd.1992.1992.mmmm@gmail.com	0559300261	customer	\N	2026-06-15 20:05:23.134568+00	2026-06-18 22:50:00.581+00	\N	\N	\N	2026-06-18 22:50:00.581+00	\N	ar
48	user_3FJ6GZ3kZMWZYsBGCTtMHQ9hc8K	1111	lolo.lolo.1993.1993.1@gmail.com	\N	provider	\N	2026-06-18 11:05:49.735102+00	2026-06-19 00:10:49.377+00	\N	\N	\N	2026-06-19 00:10:49.376+00	\N	ar
\.


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, true);


--
-- Name: commission_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commission_ledger_id_seq', 1, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 5, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 157, true);


--
-- Name: offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.offers_id_seq', 6, true);


--
-- Name: provider_skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.provider_skills_id_seq', 2, true);


--
-- Name: providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.providers_id_seq', 6, true);


--
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.requests_id_seq', 17, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, true);


--
-- Name: skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.skills_id_seq', 138, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 48, true);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: commission_ledger commission_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_ledger
    ADD CONSTRAINT commission_ledger_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: provider_skills provider_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_skills
    ADD CONSTRAINT provider_skills_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: requests requests_request_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_request_number_unique UNIQUE (request_number);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: skills skills_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_slug_unique UNIQUE (slug);


--
-- Name: users users_clerk_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: commission_ledger_request_commission_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX commission_ledger_request_commission_uq ON public.commission_ledger USING btree (request_id) WHERE (type = 'commission'::text);


--
-- Name: idx_requests_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_skill_id ON public.requests USING btree (skill_id);


--
-- Name: chat_messages chat_messages_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: chat_messages chat_messages_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: chat_messages chat_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: commission_ledger commission_ledger_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_ledger
    ADD CONSTRAINT commission_ledger_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: commission_ledger commission_ledger_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_ledger
    ADD CONSTRAINT commission_ledger_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: contact_messages contact_messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: offers offers_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: offers offers_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: provider_skills provider_skills_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_skills
    ADD CONSTRAINT provider_skills_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_skills provider_skills_skill_id_skills_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_skills
    ADD CONSTRAINT provider_skills_skill_id_skills_id_fk FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: providers providers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: requests requests_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: requests requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: reviews reviews_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: reviews reviews_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict uvQxg0B6EOeb2gksOp6m2kZA5qhDZKR5rEn0yHLRkPfW3Ss37dl0OpagVb3hkXu

