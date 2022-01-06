/**
 * SCRIPT TO PRE-POPULATE WEEKLY REPORTS
 * -------------------------------------        
 * 
 * v1.1
 * Created by: Christopher Webster <cwebster@law.umaryland.edu>
 * 
 * This script pre-populates weekly reports
 * for each Food Assistance Provider, copying 
 * relevant distribution data from a table
 * of model distributions.
 */

// Table Objects
let fapTable = base.getTable('Food Assistance Providers');
let modelDistributionsTable = base.getTable("Model Distributions");
let reportsTable = base.getTable("Reports");
let distributionsTable = base.getTable("Distributions");

// 1. Grab all providers
let foodAssistanceProviders = await fapTable.selectRecordsAsync({fields: ["Name", "IsReporting", "Distribution Profiles"]})

// 2. Grab profiles for each of those providers
let modelDistributions = await modelDistributionsTable.selectRecordsAsync({fields: [
    "Name", 
    "Food Assistance Provider", 
    "Combined Address", 
    "Street Address", 
    "City", 
    "Zip", 
    "Other Services", 
    "Educational Materials", 
    "Choice Level",
    "Type"
    ]})

// 2.1 Create a report for that provider, and the add the profile.
let reports = await reportsTable.selectRecordsAsync({fields: ["ReportID", "Food Assistance Provider", "Distributions", "Report Start", "Report End"]})

//Figure out the dates (For Now, then back 6 days)
let reportEnd = new Date(Date.now());
let reportStart = new Date(Date.now());
reportStart.setDate(reportStart.getDate() - 6);

console.info("Generating reports for " + reportStart.toLocaleString() + " - " + reportEnd.toLocaleString())

let count = 0;
for (let foodAssistanceProvider of foodAssistanceProviders.records) {
    count++;
    console.info(count + ") Working on " + foodAssistanceProvider.name);
    
    //Only process those that are recording
    if(foodAssistanceProvider.getCellValue("IsReporting")) {
        console.info(count + ".1) generating report");    
        
        // Go through the model distributions 
        let newDistributions = []
        let subcount = 0;
        for (let modelDistribution of modelDistributions.records) {

            let modelFAP = modelDistribution.getCellValue("Food Assistance Provider");
            if( modelFAP !== null && modelFAP[0].id === foodAssistanceProvider.id){
                subcount++;
                console.info(count + ".1." + subcount + ") adding distribution from model " + modelDistribution.getCellValue("Food Assistance Provider")[0].id);

                //Create new distribution in distributions table
                let newDist = await distributionsTable.createRecordAsync({
                    "Name": modelDistribution.getCellValueAsString("Name"),
                    "Food Assistance Provider": modelFAP,
                    "Street Address": modelDistribution.getCellValueAsString("Street Address"),
                    "City": modelDistribution.getCellValueAsString("City"), 
                    "Zip": modelDistribution.getCellValue("Zip"),
                    "Other Services": modelDistribution.getCellValue("Other Services"),
                    "Educational Materials": modelDistribution.getCellValue("Educational Materials"),
                    "Choice Level": modelDistribution.getCellValue("Choice Level"),
                    "Type": modelDistribution.getCellValue("Type")
                })

               newDistributions.push({id: newDist})

            }
        }

        // Set up the new report
        console.info(count + ".2) Saving new report for " + foodAssistanceProvider.name)
        let newReport = reportsTable.createRecordAsync({
            "Food Assistance Provider": new Array({id: foodAssistanceProvider.id}),
            "Report Start": reportStart,
            "Report End": reportEnd,
            "Distributions": newDistributions
        })
    }
}

console.debug("DONE!")
    
