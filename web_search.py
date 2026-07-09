import re


try:
    from ddgs import DDGS
    DDGS_AVAILABLE = True
except Exception:
    DDGS_AVAILABLE = False


def clean_query(query):
    query = query.strip()

    replacements = [
        "busca en internet",
        "busca",
        "buscar",
        "investiga",
        "investigar",
        "dime",
        "quiero saber"
    ]

    lowered = query.lower()

    for word in replacements:
        if lowered.startswith(word):
            query = query[len(word):].strip()
            lowered = query.lower()

    return query


def search_with_ddgs(query):
    results = []

    if not DDGS_AVAILABLE:
        return results

    try:
        with DDGS() as ddgs:
            search_results = ddgs.text(
                query,
                region="es-es",
                safesearch="moderate",
                max_results=6
            )

            for item in search_results:
                title = item.get("title", "")
                body = item.get("body", "")
                href = item.get("href", "")

                if title or body:
                    results.append({
                        "title": title,
                        "summary": body,
                        "url": href
                    })

    except Exception:
        return []

    return results


def internet_search(query):
    query = clean_query(query)

    if not query:
        return "No se proporcionó un tema claro para buscar."

    results = search_with_ddgs(query)

    if not results:
        return (
            "No se encontraron resultados útiles en internet. "
            "Responde con conocimiento general y aclara si el dato puede requerir verificación."
        )

    context = f"Consulta realizada en internet: {query}\n\n"
    context += "Resultados encontrados:\n\n"

    for index, result in enumerate(results[:6], start=1):
        context += f"Fuente {index}\n"
        context += f"Título: {result['title']}\n"
        context += f"Resumen: {result['summary']}\n"
        context += f"URL: {result['url']}\n\n"

    return context


def needs_internet(user_message):
    text = user_message.lower()

    internet_keywords = [
        "busca",
        "buscar",
        "investiga",
        "internet",
        "actual",
        "actualmente",
        "hoy",
        "reciente",
        "recientes",
        "ultimas",
        "últimas",
        "ultimo",
        "último",
        "noticias",
        "precio",
        "fecha",
        "fechas",
        "horario",
        "calendario",
        "mundial",
        "fifa",
        "copa mundial",
        "version actual",
        "versión actual",
        "quien es el presidente",
        "quién es el presidente"
    ]

    for keyword in internet_keywords:
        if keyword in text:
            return True

    if re.search(r"\b2025\b|\b2026\b|\b2027\b", text):
        return True

    return False