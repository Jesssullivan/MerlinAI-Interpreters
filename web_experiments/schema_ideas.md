## *demos, annotators ***Π*** competitiveness*

a ***single annotation*** as first class entry in database:
|id|category_id|supercategory|media_source|attribution|bbox|user_id|
|---|---|---|---|---|---|---|
| unique annotation identifier |species, etc  | family, genus, etc | url to media being annotated; for browser spectrogram demo, this is the `audio` field; otherwise linked via `image_id` needn't be Macaulay specific |attribution to media source; author; link to media's license| bounding array of annotation box |registered individual who made the annotation|

- database of annotations may hold many entries describing the same media, by different users

- unregistered users may annotate and play with tools as much as they want, cannot save / contribute their annotations

- untrusted (new) registered users may save / contribute their annotations with a confidence level of 1

- trusted registered users with more than 5 or more trust points may save / contribute their annotations with a confidence level of 1 or 2 (e.g. duplicate their annotation) (or 0 / just don't save that annotation)

- a user may become trusted if 3 of their annotations contribute to completed annotations

- to complete an annotation, entries of **X** media must be replicated **Y** times- e.g. identical `catagory`, `supercatagory`, `bbox` centroid is within **T** threshold of each other (`bbox` values can be averaged to single annotation)

- users cannot modify existing annotations, that's cheating

- [just began enumerating features here on Figma](https://www.figma.com/file/CgscKZmdW3WKN3JGkjQsU7/WebAnnotatorFeatureNotes12.03.20?node-id=7%3A5536)

- - -


- *an entry, interoperable w/ Lab of O:*
```
{'id': 'c466fac6-5c77-4725-9e1a-5627c190ce08',
 'bbox': [0.03729166507720947,
  0.31716904264146634,
  0.0096875,
  0.3799303977272727],
 'user_id': '123abc',
 'image_id': 123456789,
 'username': 'abc123',
 'category_id': 'swaspa',
 'supercategory': 'Bird'
}
```


todo:
- what if a user is really untrustworthy?
- send, share wireframe figma to slack people asap




    """
    
    def get(self):
        token_data = jwt.decode(request.headers.get('AccessToken'), app.config['SECRET_KEY'])
        user = app.db.users.find_one({"id": token_data['user_id']}, {
            "_id": 0,
            "password": 0
        })

        if user:
            resp = tools.JsonResp(user, 200)
        else:
            resp = tools.JsonResp({"message": "User not found"}, 404)

        return resp

    def get_auth(self):
        access_token = request.headers.get("AccessToken")
        refresh_token = request.headers.get("RefreshToken")

        resp = tools.JsonResp({"message": "User not logged in"}, 401)

        if access_token:
            try:
                decoded = jwt.decode(access_token, app.config["SECRET_KEY"])
                resp = tools.JsonResp(decoded, 200)
            except:
                # If the access_token has expired, get a new access_token - so long as the refresh_token hasn't
                # expired yet
                resp = auth.refreshAccessToken(refresh_token)

        return resp

    def login(self):
        resp = tools.JsonResp({"message": "Invalid user credentials"}, 403)

        try:
            data = json.loads(request.data)
            email = data["email"].lower()
            user = app.db.users.find_one({"email": email}, {"_id": 0})

            if user and pbkdf2_sha256.verify(data["password"], user["password"]):
                access_token = auth.encodeAccessToken(user["id"], user["email"], user["plan"])
                refresh_token = auth.encodeRefreshToken(user["id"], user["email"], user["plan"])

                app.db.users.update({"id": user["id"]}, {"$set": {
                    "refresh_token": refresh_token,
                    "last_login": tools.nowDatetimeUTC()
                }})

                resp = tools.JsonResp({
                    "id": user["id"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "plan": user["plan"],
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }, 200)

        except Exception:
            pass

        return resp

    def logout(self):
        try:
            tokenData = jwt.decode(request.headers.get("AccessToken"), app.config["SECRET_KEY"])
            app.db.users.update({"id": tokenData["user_id"]}, {'$unset': {"refresh_token": ""}})
            # Note: At some point I need to implement Token Revoking/Blacklisting
            # General info here: https://flask-jwt-extended.readthedocs.io/en/latest/blacklist_and_token_revoking.html
        except:
            pass

        resp = tools.JsonResp({"message": "User logged out"}, 200)

        return resp

    def add(self):
        data = json.loads(request.data)

        expected_data = {
            "first_name": data['first_name'],
            "last_name": data['last_name'],
            "email": data['email'].lower(),
            "password": data['password']
        }

        # Merge the posted data with the default user attributes
        self.defaults.update(expected_data)
        user = self.defaults

        # Encrypt the password
        user["password"] = pbkdf2_sha256.encrypt(user["password"], rounds=20000, salt_size=16)

        # Make sure there isn"t already a user with this email address
        existing_email = app.db.users.find_one({"email": user["email"]})

        if existing_email:
            resp = tools.JsonResp({
                "message": "There's already an account with this email address",
                "error": "email_exists"
            }, 400)

        else:
            if app.db.users.save(user):

                # Log the user in (create and return tokens)
                access_token = auth.encodeAccessToken(user["id"], user["email"], user["plan"])
                refresh_token = auth.encodeRefreshToken(user["id"], user["email"], user["plan"])

                app.db.users.update({"id": user["id"]}, {
                    "$set": {
                        "refresh_token": refresh_token
                    }
                })

                resp = tools.JsonResp({
                    "id": user["id"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "plan": user["plan"],
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }, 200)

            else:
                resp = tools.JsonResp({"message": "User could not be added"}, 400)

        return resp
    """

