import datetime
import random

people = ['Gene','Rahul','Andrew','Kevin','Aaron','Carl','Brendan','Hemachandra']
random.seed(str(datetime.date.today()))
random.shuffle(people)
for person in people:
    print(person)
