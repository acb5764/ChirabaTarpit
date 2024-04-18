# this is a collection node, designed to simply listen for requests and serve them
from aiohttp import web
import arrow
import logging
import json

logging.basicConfig(level=logging.INFO)
requests = []


async def capture(request):
    peername = request.transport.get_extra_info("peername")
    host, port, body = request.remote, None, []
    if request.body_exists:
        body = await request.text()
    if peername is not None:
        host, port = peername
    requests.append({
        "address": host,
        "observed_at": arrow.utcnow().isoformat(),
        "context": {
            "host": host,
            "port": port or 0,
            "request_body": str(body),
            "headers": dict(request.headers),
            "query": request.query_string,
            "path": request.raw_path,
            "url": str(request.url),
            "version": "HTTP/{}.{}".format(*request.version),
            "remote": request.remote,
        }
    })
    return web.Response(text="its a trap!")


async def serve_results(request):
    return web.Response(body=json.dumps(requests), content_type="application/json")


async def favicon(request):
    return web.FileResponse("./favicon.ico")

app = web.Application()
app.router.add_get('/capturedrequests', serve_results)
app.router.add_get('/favicon.ico', favicon)
app.router.add_route('*', '/{tail:.*}', capture)

if __name__ == '__main__':
    web.run_app(app)
