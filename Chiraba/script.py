import datetime
import random
import hashlib
hash = hashlib.new('sha256')
hash.update(str(datetime.date.today()).encode())

people = ['Gene','Rahul','Andrew','Kevin','Aaron','Carl','Brendan','Hemachandra']
random.seed(hash.hexdigest())
random.shuffle(people)
for person in people:
    print(person)
