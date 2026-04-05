-- Add full-text search column
ALTER TABLE "Entry" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for fast search
CREATE INDEX "entry_search_idx" ON "Entry" USING GIN ("search_vector");

-- Create function to update search vector
CREATE OR REPLACE FUNCTION entry_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('swedish', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('swedish', coalesce(array_to_string(NEW.ingredients, ' '), '')), 'B') ||
    setweight(to_tsvector('swedish', coalesce(NEW.instructions, '')), 'C') ||
    setweight(to_tsvector('swedish', coalesce(NEW.content, '')), 'C') ||
    setweight(to_tsvector('swedish', coalesce(NEW.notes, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER entry_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Entry"
  FOR EACH ROW
  EXECUTE FUNCTION entry_search_vector_update();
