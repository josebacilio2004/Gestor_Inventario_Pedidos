-- PostgreSQL database dump


-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

-- Name: update_capital_devuelto(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE FUNCTION public.update_capital_devuelto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Actualizar el capital devuelto en la tabla pedidos
    UPDATE pedidos 
    SET capital_devuelto = (
        SELECT COALESCE(SUM(monto), 0) 
        FROM pagos_capital 
        WHERE pedido_id = NEW.pedido_id 
        AND tipo_pago IN ('capital', 'mixto')
    )
    WHERE id = NEW.pedido_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_capital_devuelto() OWNER TO postgres;

-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

-- Name: compradores; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.compradores (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    contacto character varying(255),
    telefono character varying(50),
    email character varying(255),
    notas text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario character varying(100),
    password_hash character varying(255),
    activo boolean DEFAULT true
);


ALTER TABLE public.compradores OWNER TO postgres;

-- Name: compradores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.compradores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compradores_id_seq OWNER TO postgres;

-- Name: compradores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.compradores_id_seq OWNED BY public.compradores.id;


-- Name: distribuidores; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.distribuidores (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    contacto character varying(255),
    telefono character varying(50),
    email character varying(255),
    direccion text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.distribuidores OWNER TO postgres;

-- Name: distribuidores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.distribuidores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.distribuidores_id_seq OWNER TO postgres;

-- Name: distribuidores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.distribuidores_id_seq OWNED BY public.distribuidores.id;


-- Name: inversionistas; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.inversionistas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    contacto character varying(255),
    telefono character varying(50),
    email character varying(255),
    notas text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario character varying(100),
    password_hash character varying(255),
    activo boolean DEFAULT true
);


ALTER TABLE public.inversionistas OWNER TO postgres;

-- Name: inversionistas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.inversionistas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inversionistas_id_seq OWNER TO postgres;

-- Name: inversionistas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.inversionistas_id_seq OWNED BY public.inversionistas.id;


-- Name: pagos_capital; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.pagos_capital (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_pago date NOT NULL,
    tipo_pago character varying(50) DEFAULT 'capital'::character varying,
    metodo_pago character varying(100),
    comprobante character varying(255),
    notas text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pagos_capital_monto_check CHECK ((monto > (0)::numeric)),
    CONSTRAINT pagos_capital_tipo_pago_check CHECK (((tipo_pago)::text = ANY ((ARRAY['capital'::character varying, 'ganancia'::character varying, 'mixto'::character varying])::text[])))
);


ALTER TABLE public.pagos_capital OWNER TO postgres;

-- Name: pagos_capital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.pagos_capital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_capital_id_seq OWNER TO postgres;

-- Name: pagos_capital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.pagos_capital_id_seq OWNED BY public.pagos_capital.id;


-- Name: pagos_ganancia; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.pagos_ganancia (
    id integer NOT NULL,
    pedido_id integer,
    monto numeric(10,2) NOT NULL,
    fecha_pago date NOT NULL,
    tipo_pago character varying(50) DEFAULT 'Ganancia'::character varying,
    notas text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pagos_ganancia_monto_check CHECK ((monto > (0)::numeric))
);


ALTER TABLE public.pagos_ganancia OWNER TO postgres;

-- Name: pagos_ganancia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.pagos_ganancia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_ganancia_id_seq OWNER TO postgres;

-- Name: pagos_ganancia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.pagos_ganancia_id_seq OWNED BY public.pagos_ganancia.id;


-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    fecha_pedido date NOT NULL,
    producto_id integer NOT NULL,
    distribuidor_id integer NOT NULL,
    inversionista_id integer,
    comprador_id integer,
    cantidad integer NOT NULL,
    capital_invertido numeric(10,2) NOT NULL,
    capital_devuelto numeric(10,2) DEFAULT 0,
    capital_pendiente numeric(10,2) GENERATED ALWAYS AS ((capital_invertido - capital_devuelto)) STORED,
    ganancia_esperada numeric(10,2) NOT NULL,
    ganancia_real numeric(10,2) DEFAULT 0,
    ganancia_devuelta boolean DEFAULT false,
    fecha_ganancia_devuelta timestamp without time zone,
    devolucion_capital numeric(10,2) DEFAULT 0,
    estado character varying(50) DEFAULT 'pendiente'::character varying,
    notas text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ganancia_pendiente numeric(10,2),
    ganancia_devuelta_monto numeric(10,2) DEFAULT 0,
    CONSTRAINT pedidos_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT pedidos_capital_devuelto_check CHECK ((capital_devuelto >= (0)::numeric)),
    CONSTRAINT pedidos_capital_invertido_check CHECK ((capital_invertido >= (0)::numeric)),
    CONSTRAINT pedidos_check CHECK ((capital_devuelto <= capital_invertido)),
    CONSTRAINT pedidos_devolucion_capital_check CHECK ((devolucion_capital >= (0)::numeric)),
    CONSTRAINT pedidos_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_proceso'::character varying, 'completado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT pedidos_ganancia_esperada_check CHECK ((ganancia_esperada >= (0)::numeric)),
    CONSTRAINT pedidos_ganancia_real_check CHECK ((ganancia_real >= (0)::numeric))
);


ALTER TABLE public.pedidos OWNER TO postgres;

-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


-- Name: productos; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    tipo_producto character varying(100) NOT NULL,
    precio_referencia numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.productos OWNER TO postgres;

-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


-- Name: usuarios_admin; Type: TABLE; Schema: public; Owner: postgres

CREATE TABLE public.usuarios_admin (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    usuario character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(255),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios_admin OWNER TO postgres;

-- Name: usuarios_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres

CREATE SEQUENCE public.usuarios_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_admin_id_seq OWNER TO postgres;

-- Name: usuarios_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres

ALTER SEQUENCE public.usuarios_admin_id_seq OWNED BY public.usuarios_admin.id;


-- Name: vista_compradores_resumen; Type: VIEW; Schema: public; Owner: postgres

CREATE VIEW public.vista_compradores_resumen AS
 SELECT c.id,
    c.nombre,
    c.contacto,
    c.telefono,
    count(p.id) AS total_pedidos,
    COALESCE(sum(p.capital_invertido), (0)::numeric) AS capital_total_gestionado,
    COALESCE(sum(p.capital_devuelto), (0)::numeric) AS capital_devuelto,
    COALESCE(sum(p.capital_pendiente), (0)::numeric) AS capital_pendiente_devolver,
    COALESCE(sum(p.ganancia_real), (0)::numeric) AS ganancia_generada
   FROM (public.compradores c
     LEFT JOIN public.pedidos p ON ((c.id = p.comprador_id)))
  GROUP BY c.id, c.nombre, c.contacto, c.telefono;


ALTER VIEW public.vista_compradores_resumen OWNER TO postgres;

-- Name: vista_inversionistas_resumen; Type: VIEW; Schema: public; Owner: postgres

CREATE VIEW public.vista_inversionistas_resumen AS
 SELECT i.id,
    i.nombre,
    i.contacto,
    i.telefono,
    count(p.id) AS total_pedidos,
    COALESCE(sum(p.capital_invertido), (0)::numeric) AS capital_total_invertido,
    COALESCE(sum(p.capital_devuelto), (0)::numeric) AS capital_total_devuelto,
    COALESCE(sum(p.capital_pendiente), (0)::numeric) AS capital_total_pendiente,
    COALESCE(sum(p.ganancia_real), (0)::numeric) AS ganancia_total_real,
    COALESCE(sum(
        CASE
            WHEN p.ganancia_devuelta THEN p.ganancia_real
            ELSE (0)::numeric
        END), (0)::numeric) AS ganancia_devuelta,
    COALESCE(sum(
        CASE
            WHEN (NOT p.ganancia_devuelta) THEN p.ganancia_real
            ELSE (0)::numeric
        END), (0)::numeric) AS ganancia_pendiente
   FROM (public.inversionistas i
     LEFT JOIN public.pedidos p ON ((i.id = p.inversionista_id)))
  GROUP BY i.id, i.nombre, i.contacto, i.telefono;


ALTER VIEW public.vista_inversionistas_resumen OWNER TO postgres;

-- Name: compradores id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.compradores ALTER COLUMN id SET DEFAULT nextval('public.compradores_id_seq'::regclass);


-- Name: distribuidores id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.distribuidores ALTER COLUMN id SET DEFAULT nextval('public.distribuidores_id_seq'::regclass);


-- Name: inversionistas id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.inversionistas ALTER COLUMN id SET DEFAULT nextval('public.inversionistas_id_seq'::regclass);


-- Name: pagos_capital id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pagos_capital ALTER COLUMN id SET DEFAULT nextval('public.pagos_capital_id_seq'::regclass);


-- Name: pagos_ganancia id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pagos_ganancia ALTER COLUMN id SET DEFAULT nextval('public.pagos_ganancia_id_seq'::regclass);


-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


-- Name: usuarios_admin id; Type: DEFAULT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.usuarios_admin ALTER COLUMN id SET DEFAULT nextval('public.usuarios_admin_id_seq'::regclass);


-- Name: compradores compradores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.compradores
    ADD CONSTRAINT compradores_pkey PRIMARY KEY (id);


-- Name: compradores compradores_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.compradores
    ADD CONSTRAINT compradores_usuario_key UNIQUE (usuario);


-- Name: distribuidores distribuidores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.distribuidores
    ADD CONSTRAINT distribuidores_pkey PRIMARY KEY (id);


-- Name: inversionistas inversionistas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.inversionistas
    ADD CONSTRAINT inversionistas_pkey PRIMARY KEY (id);


-- Name: inversionistas inversionistas_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.inversionistas
    ADD CONSTRAINT inversionistas_usuario_key UNIQUE (usuario);


-- Name: pagos_capital pagos_capital_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pagos_capital
    ADD CONSTRAINT pagos_capital_pkey PRIMARY KEY (id);


-- Name: pagos_ganancia pagos_ganancia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pagos_ganancia
    ADD CONSTRAINT pagos_ganancia_pkey PRIMARY KEY (id);


-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


-- Name: usuarios_admin usuarios_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.usuarios_admin
    ADD CONSTRAINT usuarios_admin_pkey PRIMARY KEY (id);


-- Name: usuarios_admin usuarios_admin_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.usuarios_admin
    ADD CONSTRAINT usuarios_admin_usuario_key UNIQUE (usuario);


-- Name: idx_pagos_fecha; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pagos_fecha ON public.pagos_capital USING btree (fecha_pago);


-- Name: idx_pagos_pedido; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pagos_pedido ON public.pagos_capital USING btree (pedido_id);


-- Name: idx_pedidos_comprador; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pedidos_comprador ON public.pedidos USING btree (comprador_id);


-- Name: idx_pedidos_distribuidor; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pedidos_distribuidor ON public.pedidos USING btree (distribuidor_id);


-- Name: idx_pedidos_estado; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pedidos_estado ON public.pedidos USING btree (estado);


-- Name: idx_pedidos_fecha; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pedidos_fecha ON public.pedidos USING btree (fecha_pedido);


-- Name: idx_pedidos_inversionista; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pedidos_inversionista ON public.pedidos USING btree (inversionista_id);


-- Name: idx_pedidos_producto; Type: INDEX; Schema: public; Owner: postgres

CREATE INDEX idx_pedidos_producto ON public.pedidos USING btree (producto_id);


-- Name: pagos_capital update_capital_after_pago; Type: TRIGGER; Schema: public; Owner: postgres

CREATE TRIGGER update_capital_after_pago AFTER INSERT OR DELETE OR UPDATE ON public.pagos_capital FOR EACH ROW EXECUTE FUNCTION public.update_capital_devuelto();


-- Name: pedidos update_pedidos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Name: pagos_capital pagos_capital_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pagos_capital
    ADD CONSTRAINT pagos_capital_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


-- Name: pagos_ganancia pagos_ganancia_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pagos_ganancia
    ADD CONSTRAINT pagos_ganancia_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


-- Name: pedidos pedidos_comprador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_comprador_id_fkey FOREIGN KEY (comprador_id) REFERENCES public.compradores(id) ON DELETE RESTRICT;


-- Name: pedidos pedidos_distribuidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_distribuidor_id_fkey FOREIGN KEY (distribuidor_id) REFERENCES public.distribuidores(id) ON DELETE RESTRICT;


-- Name: pedidos pedidos_inversionista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_inversionista_id_fkey FOREIGN KEY (inversionista_id) REFERENCES public.inversionistas(id) ON DELETE RESTRICT;


-- Name: pedidos pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


-- PostgreSQL database dump complete


