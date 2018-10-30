# EBPP

Epic Birding Predicting Project: Predicting good birding near you

This project is currently under development.  

# Status:
    Scores are calculated and held in AWS/RDS MySQL.  Front end develoment is underway, with local a local subset / server (entirely made up of Mallard Ducks, FWIW)
    See video Reference; 
    
# Updates:
    In addition the generation of backend "scores" in Python/R, the front end is being sketched out with Node.JS / Express, MySQL, and a Jade HTML rending setup. 
    
ReactJS and React Native JS are strong contenders for a serverless, squlite system (an app!) in the long run. 

# There are a few main functions for the EBPP.  

It all revolves around a static database of "birbscores" or location, time, and species specific values implying likelyhood of detection by a birder.  

# 10.30.18 Goal GUI Methods:

#  Where?
    “Please select a county location from the drop down menu.”


#  What?

Returns a descending list of 20 different species with the highest birb scores at location and date +- 2 days (allowing for a “work week” buffer for no data)


# When?

Returns “The best day to see this species in county is date”
Returns a graph of birb scores through 365 days (important feature)

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
