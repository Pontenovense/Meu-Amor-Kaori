-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create months table
CREATE TABLE months (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    month_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month_id UUID NOT NULL REFERENCES months(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt TEXT,
    description TEXT,
    image_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_images_month_id ON images(month_id);
CREATE INDEX idx_images_order ON images(month_id, image_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for months table
CREATE TRIGGER update_months_updated_at
    BEFORE UPDATE ON months
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data (existing months from the website)
INSERT INTO months (name, description) VALUES
('Fevereiro', 'Minha vida, em fevereiro fizemos varias coisas, mas oq destacou foi a nossa viagem para a praia, foi incrível, nos divertimos, jogamos vôlei, nadamos no mar, curtimos o carnaval e o mais importante, ficamos juntos.'),
('Março', 'Meu amor, neste mes de Março, nao fizemos muitas coisas que destacaram, mas com certeza fomos felizes, voce ao meu lado e eu ao seu lado, como sempre e pra sempre. Desejo que o mes de Abril seja repleto de amor, carinho e felicidade, bjss meu amor.'),
('Abril', 'É Minha Princesa, completamos mais um mes juntos de muitos, o mes de abril foi um mes incrível como todos, jantamos, começamos a vender os deliciosos docinhos do meu amor, fomos no arca, brincamos, com certeza foi o mes que mais dormimos juntos kkk, e o mais importante como sempre digo, ficamos juntos. Gostaria de agradecer por tudo e mais um pouco por ser a minha princesa todos os dias, bjss meu amor.'),
('Maio', '⏳'),
('Junho', 'Mes de junho, mes do amor, mes dos dias dos namorados e como sempre, um mes de muitas felicidades e dificuldades, fomos jantar mais uma vez no Madero kkk, a gente gosta de muito de la, ate ficamos palpitando sobre os casais que estavam la, se eram casais recentes ou velhos. Enfim mais um mes com o amor da minha vida, bjss meu amor.');

-- Insert initial images
-- Fevereiro images
INSERT INTO images (month_id, url, alt, description, image_order) VALUES
((SELECT id FROM months WHERE name = 'Fevereiro'), 'assets/fevereiro/restaurante.jpg', 'Jogando Vôlei', NULL, 1),
((SELECT id FROM months WHERE name = 'Fevereiro'), 'assets/fevereiro/beijo.jpg', 'Dando Beijo', NULL, 2),
((SELECT id FROM months WHERE name = 'Fevereiro'), 'assets/fevereiro/volei.jpg', 'Jantando Restaurante', NULL, 3);

-- Março images
INSERT INTO images (month_id, url, alt, description, image_order) VALUES
((SELECT id FROM months WHERE name = 'Março'), 'assets/marco/1.jpg', '', NULL, 1),
((SELECT id FROM months WHERE name = 'Março'), 'assets/marco/2.jpg', '', NULL, 2),
((SELECT id FROM months WHERE name = 'Março'), 'assets/marco/3.jpg', '', NULL, 3);

-- Abril images
INSERT INTO images (month_id, url, alt, description, image_order) VALUES
((SELECT id FROM months WHERE name = 'Abril'), 'assets/abril/1.jpg', '', 'Esperando o ônibus para buscar o presente', 1),
((SELECT id FROM months WHERE name = 'Abril'), 'assets/abril/2.jpg', '', 'Presente em mãos', 2),
((SELECT id FROM months WHERE name = 'Abril'), 'assets/abril/3.jpg', '', NULL, 3),
((SELECT id FROM months WHERE name = 'Abril'), 'assets/abril/4.jpg', '', NULL, 4);

-- Junho images
INSERT INTO images (month_id, url, alt, description, image_order) VALUES
((SELECT id FROM months WHERE name = 'Junho'), 'assets/junho/1.jpg', '', NULL, 1),
((SELECT id FROM months WHERE name = 'Junho'), 'assets/junho/2.jpg', '', NULL, 2),
((SELECT id FROM months WHERE name = 'Junho'), 'assets/junho/3.jpg', '', NULL, 3);

-- Enable Row Level Security (RLS)
ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Allow authenticated users to manage months" ON months
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to manage images" ON images
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create policies for public read access (for the website)
CREATE POLICY "Allow public to read months" ON months
    FOR SELECT USING (true);

CREATE POLICY "Allow public to read images" ON images
    FOR SELECT USING (true);

-- Storage policies for images bucket
-- Allow authenticated users to upload, update, and delete images
CREATE POLICY "Allow authenticated users to manage images storage" ON storage.objects
    FOR ALL USING (bucket_id = 'images' AND auth.uid() IS NOT NULL);

-- Allow public to read images (for the website)
CREATE POLICY "Allow public to read images storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');
