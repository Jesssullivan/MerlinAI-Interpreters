
# set `devel = False` for deployment
devel = False

# set `prerender = False` for deployment-
# renders & bundles should already be generated
prerender = False

# port `80` is enforced if devel = False
devport = 5000

# host `0.0.0.0` is enforced if devel = False
devhost = '127.0.0.1'

# rendered html extension:
ext = '_render.html'
static = "./demos/" if devel else "./production/"


# default html chunks:
header = static + 'templates/header.html'
footer = static + 'templates/footer.html'
