-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Function: update_project_task_id
CREATE FUNCTION public.update_project_task_id() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT COALESCE(MAX(project_task_id), 0) + 1
    INTO NEW.project_task_id
    FROM tasks
    WHERE project_id = NEW.project_id;
    
    RETURN NEW;
END;
$$;

-- Projects table
CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100),
    guest_id character varying(36),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tasks table
CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    link character varying(255),
    priority text,
    assign_to character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    project_id uuid NOT NULL,
    progress text,
    project_task_id integer,
    CONSTRAINT tasks_priority_check CHECK (
        priority = ANY (ARRAY['low', 'medium', 'high'])
    ),
    CONSTRAINT tasks_progress_check CHECK (
        progress = ANY (ARRAY['backlog', 'in progress', 'for checking', 'done'])
    )
);

-- Tasks ID sequence
CREATE SEQUENCE public.tasks_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;
ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq');

-- Users table
CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100),
    project_id uuid NOT NULL,
    guest_id character varying(36),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Users ID sequence
CREATE SEQUENCE public.users_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq');

-- Trigger
CREATE TRIGGER set_project_task_id
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_project_task_id();

