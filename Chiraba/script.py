people = ['Gene','Rahul','Andrew','Kevin','Aaron','Carl','Brendan','Hemachandra']

import requests
import datetime
import random
##import randfacts
random.seed(str(datetime.date.today()))
random.shuffle(people)
# today = datetime.datetime.strftime('%m/%d')
# url = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all'+ today

# headers = {
#     'Authorization': 'Bearer: {}'.format(token),
#     'User-Agent': 'ScrumFacts (aaron.brvenik@threatq.com'
# }
# response = requests.get(url, headers).json()
# response.get()
# print(list(people))
for person in people:
    print(person)
# print()
# print(randfacts.get_fact())
