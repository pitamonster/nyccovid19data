# NYC Covid19 Data


## How to deploy js

Pushing to 'main' branch, will autodeploy `web` to Netlify.


## How to deploy go scripts

### Login to heroku
```
heroku login
```

### Push go dir to heroku

```
git subtree push --prefix=go heroku main
```

OR to force push, use this craziness:

```
git push heroku `git subtree split --prefix=go main`:main --force
```
