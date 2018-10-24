file = "QuotedTaxa.csv"
t = 4 # col num
df <- read.csv(file)
list <- data.frame("output",stringsAsFactors = FALSE)
for(i in 1:length(list[,t])){
    concat <- paste('"', df[i,t], '",', sep="")
    list <- rbind(concat, list)
}
write.csv(list, "output.csv")
