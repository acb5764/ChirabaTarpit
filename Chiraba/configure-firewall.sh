## Not really a script, just notes
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p
apt update && apt install iptables git nodejs python3 screen -y
iptables -t nat -A PREROUTING -p tcp --dport 1:65535 -j DNAT --to-destination :8080
iptables-save
git clone https://github.com/acb5764/ChirabaTarpit.git

##
screen nodejs ./ChirabaTarpit/Chiraba/mainserver.js
## OR
screen python3 ./ChirabaTarpit/Chiraba/chiraba.py
