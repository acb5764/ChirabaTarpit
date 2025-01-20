import aiohttp
import gzip
import shutil
from intervaltree import IntervalTree
import ipaddress
import json
import asyncio
from aiohttp import web


def insert_data_directly_into_tree(file_path):
    with open(file_path, 'r') as file:
        for line in file:
            try:
                entry = json.loads(line)
                start = int(ipaddress.IPv4Address(entry['start_ip']))
                end = int(ipaddress.IPv4Address(entry['end_ip']))
                tree.addi(start, end + 1, entry) 
            except Exception:
                pass

async def download_and_unzip_file(url, output_path):
    async with aiohttp.ClientSession() as session:
        response = await session.get(url)
        if response.status == 200:
            with open("temp_file.gz", 'wb') as f:
                f.write(await response.read())

            with gzip.open('temp_file.gz', 'rb') as f_in:
                with open(output_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)


def job():
    url = "https://ipinfo.io/data/free/country.json.gz?token=TOKEN_HERE"
    output_path = '/tmp/country.json'
    asyncio.run(download_and_unzip_file(url, output_path))
    tree.clear()
    insert_data_directly_into_tree(output_path)
    for entry in ip_ranges:
        try:
            try:
                start = int(ipaddress.IPv4Address(entry['start_ip']))
                end = int(ipaddress.IPv4Address(entry['end_ip']))
                tree[start:end + 1] = entry 
            except Exception:
                # its probably an ipv6 address
                start = int(ipaddress.IPv6Address(entry['start_ip']))
                end = int(ipaddress.IPv6Address(entry['end_ip']))
                tree[start:end + 1] = entry
        except Exception:
            pass

async def handle(request):
    ip = request.query.get('ip')
    ip_int = int(ipaddress.IPv4Address(ip))
    results = tree[ip_int]

    if results:
        data = next(iter(results)).data
        return web.Response(text=json.dumps(data), content_type='application/json')
    else:
        return web.Response(text='IP not found', status=404)


# async def run_scheduler():
#     while True:
#         schedule.run_pending()
#         await asyncio.sleep(60)

# async def start_background_tasks(app):
#     app['scheduler_task'] = app.loop.create_task(run_scheduler())

# async def cleanup_background_tasks(app):
#     app['scheduler_task'].cancel()
#     await app['scheduler_task']

app = web.Application()
# app.on_startup.append(start_background_tasks)
# app.on_cleanup.append(cleanup_background_tasks)
app.add_routes([web.get('/', handle)])

if __name__ == '__main__':
    ip_ranges = []  
    tree = IntervalTree() 
    job()  
    web.run_app(app, host='0.0.0.0', port=8080)