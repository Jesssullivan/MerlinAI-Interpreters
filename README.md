
# EBPP update 11.27.18

Epic Birding Predicting Project: Predicting good birding near you

This project is currently under development.  

# Status:
   
    Front end develoment is underway, locally (servers are off for now)
   
    
# Updates:
    In addition the generation of backend "scores" in Python/R:
    The front end is being sketched out with 
    Node.JS / Express, MySQL, and a Jade setup. 
    
ReactJS and React Native JS are strong contenders for a serverless, squlite system (an app!) in the long run. 

# There are a few main functions for the EBPP.  

It all revolves around a static database of "birbscores", or location, time, and species specific values implying likelyhood of detection by a birder.  

# 10.30.18 Goal GUI Methods:

#  What?

    Given date and location, returns the birds that are most likely to be observed


# When?

    Given species and location, returns the best day to see this species

# calculate birbscore- resulting fields:
  date "%m-%d" | state | county | species | "birbscore"

  Calculate birbscore:
  birbscore for date, state, county, species =
  max (out of 365 dates) mean for date, state, county, species  
    -divided by -
  mean for date, state, county, species


Larger data and test files are stored below:
https://www.amazon.com/clouddrive/share/STVl2Wnxz0EKN2OPjSi99egVKwopWykwkk7Y9BtrzXG

Sources:
This project uses citizen science data (eBird) data to generate statistics.  
eBird Basic Dataset. Version: EBD_relFeb-2017. Cornell Lab of Ornithology, Ithaca, New York. Feb 2017.
