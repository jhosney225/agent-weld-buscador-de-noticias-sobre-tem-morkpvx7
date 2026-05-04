import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function searchNews(topic) {
  console.log(`\n🔍 Buscando noticias sobre: ${topic}\n`);
  console.log("Procesando...\n");

  try {
    const stream = await client.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Actúa como un motor de búsqueda de noticias. Busca y resume las noticias más relevantes sobre el tema: "${topic}".

Proporciona:
1. Título de la noticia
2. Resumen breve (2-3 líneas)
3. Fuente estimada
4. Relevancia (Alta/Media/Baja)

Genera entre 3-5 noticias relevantes sobre este tema. Si no tienes información actualizada, proporciona noticias basadas en tendencias recientes del tema.

Formatea la respuesta de manera clara y legible.`,
        },
      ],
    });

    let fullResponse = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        process.stdout.write(event.delta.text);
        fullResponse += event.delta.text;
      }
    }

    console.log("\n");
    return fullResponse;
  } catch (error) {
    console.error("Error al buscar noticias:", error.message);
    throw error;
  }
}

async function getNewsSummary(topic, newsContent) {
  console.log(`\n📋 Generando resumen ejecutivo sobre: ${topic}\n`);

  try {
    const stream = await client.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Basándote en las siguientes noticias sobre "${topic}":

${newsContent}

Por favor genera:
1. Un resumen ejecutivo (máximo 200 palabras)
2. Los puntos clave más importantes
3. Impacto potencial

Sé conciso y directo.`,
        },
      ],
    });

    let fullResponse = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        process.stdout.write(event.delta.text);
        fullResponse += event.delta.text;
      }
    }

    console.log("\n");
    return fullResponse;
  } catch (error) {
    console.error("Error al generar resumen:", error.message);
    throw error;
  }
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("   🗞️  BUSCADOR DE NOTICIAS INTELIGENTE");
  console.log("═══════════════════════════════════════\n");

  let continueSearching = true;

  while (continueSearching) {
    const topic = await question(
      '¿Sobre qué tema deseas buscar noticias? (o escribe "salir" para terminar): '
    );

    if (topic.toLowerCase() === "salir") {
      console.log(
        "\n¡Gracias por usar el buscador de noticias! Hasta luego. 👋\n"
      );
      continueSearching = false;
      break;
    }

    if (topic.trim() === "") {
      console.log("Por favor ingresa un tema válido.\n");
      continue;
    }

    try {
      const newsContent = await searchNews(topic);

      const generateSummary = await question(
        "¿Deseas un resumen ejecutivo de estas noticias? (sí/no): "
      );

      if (
        generateSummary.toLowerCase() === "sí" ||
        generateSummary.toLowerCase() === "si"
      ) {
        await getNewsSummary(topic, newsContent);
      }

      const continueQuestion = await question(
        "\n¿Deseas buscar noticias sobre otro tema? (sí/no): "
      );
      if (
        continueQuestion.toLowerCase() !== "sí" &&
        continueQuestion.toLowerCase() !== "si"
      ) {
        console.log(
          "\n¡Gracias por usar el buscador de noticias! Hasta luego. 👋\n"
        );
        continueSearching = false;
      }
    } catch (error) {
      console.error("Error durante la búsqueda:", error.message);
      const retryQuestion = await question("\n¿Deseas intentar nuevamente? (sí/no): ");
      if (
        retryQuestion.toLowerCase() !== "sí" &&
        retryQuestion.toLowerCase() !== "si"
      ) {
        console.log(
          "\n¡Gracias por usar el buscador de noticias! Hasta luego. 👋\n"
        );
        continueSearching = false;
      }
    }
  }

  rl.close();
}

main().catch((error) => {
  console.error("Error fatal:", error);
  rl.close();
  process.exit(1);
});