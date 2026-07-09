from processor import clean_text


class Chatbot:
    def __init__(self, knowledge_base):
        self.knowledge_base = knowledge_base

    def get_response(self, user_message):
        cleaned_message = clean_text(user_message)

        best_intent = None
        best_score = 0

        for intent, data in self.knowledge_base.items():
            score = 0

            for keyword in data["keywords"]:
                clean_keyword = clean_text(keyword)

                if clean_keyword in cleaned_message:
                    score += 1

            if score > best_score:
                best_score = score
                best_intent = intent

        if best_intent:
            return self.knowledge_base[best_intent]["response"], best_intent

        return "Lo siento, no tengo una respuesta exacta para eso. Puedes preguntarme sobre IA, Machine Learning, Deep Learning, Python o chatbots.", "desconocido"