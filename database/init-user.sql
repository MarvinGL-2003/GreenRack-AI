INSERT INTO users (
    name,
    email,
    password_hash,
    role,
    active
)
VALUES (
    'Administrador GreenRack',
    'admin@greenrack.local',
    '$2b$12$X23llIaUDHvPMhyf9xt.uuoJjFtFeJNopzM80lsM4zw7hsCmWNst.',
    'admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
