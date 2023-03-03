# Install dependencies
apt-get update -y && apt-get upgrade -y
apt-get install -y git
apt-get install -y screen
apt-get install -y nodejs
apt-get install -y ufw

# Insert NAT rules at top of file
sed -i -e "1i COMMIT" /etc/ufw/before.rules
sed -i -e "1i -A PREROUTING -p tcp --dport 0:65535  -j REDIRECT --to-port 8080" /etc/ufw/before.rules
sed -i -e "1i -A PREROUTING -p udp --dport 0:65535  -j REDIRECT --to-port 8080" /etc/ufw/before.rules
sed -i -e "1i :PREROUTING ACCEPT [0:0]" /etc/ufw/before.rules
sed -i -e "1i *nat" /etc/ufw/before.rules

sudo ufw allow 8080/tcp
sudo ufw allow 8080/udp
systemctl restart ufw

# Clone the repo
git clone https://github.com/acb5764/ChirabaTarpit.git
cd ChirabaTarpit
git checkout abrvenik/fix-iplog

# Get the IP address and assign it as the host on the server 
ip=$(curl -s http://checkip.amazonaws.com)
sed -i -e "1i const hostname = '$ip'" Chiraba/mainserver.js
ufw enable

# Start the server
screen -S ChirabaTarpit
node Chiraba/mainserver.js
# TODO do this in a screen session?
# node ChirabaTarpit/Chiraba/mainserver.js
