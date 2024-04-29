## Not really a script, just notes
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p
apt update && apt install iptables git nodejs screen -y
iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination :443

iptables -t nat -A PREROUTING -p tcp --dport 1:442 -j DNAT --to-destination :8080
iptables -t nat -A PREROUTING -p tcp --dport 444:65535 -j DNAT --to-destination :8080



iptables-save
git clone https://github.com/acb5764/ChirabaTarpit.git
cd ChirabaTarpit/Chiraba
openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out myserver.crt -keyout myserver.key

##

 

screen nodejs ./mainserver.js
## OR
# apt install python3 pip
# python3 -m pip install arrow aiohttp
# screen python3 chiraba.py
