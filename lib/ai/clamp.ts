type JsonSchema = {
  type?: string | string[];
  maxLength?: number;
  maxItems?: number;
  minLength?: number;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
};

/**
 * O Gemini recebe o JSON Schema, mas não garante `maxLength`/`maxItems`: de vez
 * em quando devolve uma palavra-chave de 120 caracteres ou 15 itens onde cabem
 * 12. Rejeitar a resposta inteira por isso desperdiça a chamada e mostra erro
 * ao usuário. Aqui só encurtamos o que passou do limite — tipos, enums e campos
 * obrigatórios continuam sendo validados pelo zod logo depois.
 */
export function clampToJsonSchema(value: unknown, schema: JsonSchema): unknown {
  if (typeof value === 'string') {
    return schema.maxLength !== undefined ? truncate(value.trim(), schema.maxLength) : value;
  }

  if (Array.isArray(value)) {
    let items = schema.items ? value.map((item) => clampToJsonSchema(item, schema.items!)) : value;
    // Item vazio (depois do trim) em lista de texto é ruído do modelo, não dado.
    if (schema.items?.minLength) {
      items = items.filter((item) => typeof item !== 'string' || item.length > 0);
    }
    return schema.maxItems !== undefined ? items.slice(0, schema.maxItems) : items;
  }

  if (value && typeof value === 'object' && schema.properties) {
    const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in out) out[key] = clampToJsonSchema(out[key], propSchema);
    }
    return out;
  }

  return value;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  // Corta na última palavra inteira quando ela não está longe do limite.
  const space = cut.lastIndexOf(' ');
  const base = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${base.trimEnd()}…`;
}
