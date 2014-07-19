smyttesttask
============

Demo
----
Demo deployed on heroku server. Url:

http://smyttesttask.herokuapp.com/

Prepare
-------
Install virtualenv & virtualenvwrapper(optional)

Install deps(Ubuntu)
```bash
sudo apt-get install libmysqlclient-dev
```

Install
-------
```bash
$ git clone git@github.com:h0tf1x/smyttesttask.git
$ mkvirtualenv smyttesttask
(smyttesttask)$ cd smyttesttask
(smyttesttask)$ pip install -r requirements.txt
(smyttesttask)$ ./manage.py syncdb
(smyttesttask)$ ./manage.py migrate
(smyttesttask)$ ./manage.py collectstatic
```

Configure
---
edit app/settings.py (database connection settings, secret, etc.)

Run
---
```bash
(smyttesttask)$ ./manage.py runserver
```

Run Tests:
---------
```bash
(smyttesttask)$ ./manage.py test
```
