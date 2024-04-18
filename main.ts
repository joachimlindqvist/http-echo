Deno.serve({ port: Number(Deno.env.get("PORT") || 8000) }, (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/http") {
    const iterations = Number(url.searchParams.get("lines") ?? "1");
    let i = 0;

    return new Response(
      new ReadableStream({
        start(controller) {
          const te = new TextEncoder();
          controller.enqueue(te.encode((++i).toString()));
          const interval = setInterval(() => {
            try {
              if (i <= iterations) {
                controller.enqueue(te.encode((++i).toString()));
              } else {
                clearInterval(interval);
                controller.close();
              }
            } catch (e) {
              if (
                e instanceof TypeError &&
                e.message === "The stream controller cannot close or enqueue."
              ) {
                return;
              }
              throw e;
            }
          }, 1000);
        },
      })
    );
  } else if (url.pathname === "/ws") {
    const { response, socket } = Deno.upgradeWebSocket(req);

    const iterations = Number(url.searchParams.get("lines") ?? "1");
    let i = 0;

    try {
      socket.addEventListener("open", () => {
        socket.send((++i).toString());
        const interval = setInterval(() => {
          if (i <= iterations) {
            socket.send((++i).toString());
          } else {
            clearInterval(interval);
            socket.close();
          }
        }, 1000);
      });
    } catch (e) {
      console.error(e);
      if (!socket.CLOSED) {
        socket.close();
      }
    }

    return response;
  } else if (url.pathname === "/sse") {
    const iterations = Number(url.searchParams.get("lines") ?? "1");
    let i = 0;

    return new Response(
      new ReadableStream({
        start(controller) {
          const te = new TextEncoder();
          controller.enqueue(te.encode(`event: message\ndata: ${++i}\n\n`));
          const interval = setInterval(() => {
            try {
              if (i <= iterations) {
                controller.enqueue(
                  te.encode(`event: message\ndata: ${++i}\n\n`)
                );
              } else {
                clearInterval(interval);
                controller.close();
              }
            } catch (e) {
              if (
                e instanceof TypeError &&
                e.message === "The stream controller cannot close or enqueue."
              ) {
                return;
              }
              throw e;
            }
          }, 1000);
        },
      }),
      {
        headers: {
          "content-type": "text/event-stream",
        },
      }
    );
  }

  return new Response("OK", { status: 200 });
});
