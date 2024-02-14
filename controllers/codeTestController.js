const fs = require("fs");
const path = require('path');
const {exec} = require("child_process");
const {hard} = require("../constants/QB");
const getQuestionDetails = async (qId)=>{
    return hard.filter((item)=>{
        return (item.qId===qId)
    });
}
const runCodeController = async (req,res,filename)=>{
    const buildName = filename+ new Date().getTime();
    const {qId} = req.body;
    var quesDetails = await getQuestionDetails(qId);
    quesDetails = quesDetails[0];
    const validatorName = quesDetails.ansId;
    const testCaseName = quesDetails.tcId;
    const validatorBuild = validatorName.substring(0,validatorName.indexOf(".c"));
    exec(`gcc ${filename} -o ${buildName}`,(error,stdout,stderr)=>{
        if(error){
            console.error(`Compilation error: ${stderr}`);
            res.json({message:'Internal Server Error',status:false});
        }

        exec(`gcc ${validatorName} -o ${validatorBuild}`,(error,stdout,stderr)=>{
            if(error){
                console.error(`Compilation error: ${stderr}`);
                res.json({message:'Internal Server Error',status:false});
            }

            exec(`${buildName} < ${testCaseName} | ${validatorBuild}`,(error,stdout,stderr)=>{
                if(error){
                    console.error(`Execution error: ${stderr}`);
                    res.json({message:'Internal Server Error',status:false});
                }

                const output = stdout.trim();
                console.log('Output:', output);
                res.json({message:'Successfull execution!',status:true});
            })
        })
    })
}
const codeTestPipeline = async (req, res) => {
    const { code, submissionId,qId } = req.body;
    const fileName = submissionId.endsWith('.c') ? submissionId : `${submissionId}.c`;
    const directoryPath = path.join("./", 'codes');
    const filePath = path.join(directoryPath, fileName);
    try {
        fs.mkdir(directoryPath, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating directory:', err);
                res.json({message:'Internal Server Error',status:false});
                return;
            }
    
            fs.writeFile(filePath, code, (err) => {
                if (err) {
                    console.error('Error writing C code to file:', err);
                    res.json({message:'Internal Server Error',status:false});
                    return;
                }
                console.log(`C code saved to ${filePath}`);
                runCodeController(req,res,filePath);
            });
        });
    } catch (error) {
        return res.json({message:'Internal Server Error',status:false});
    }
}

module.exports = { codeTestPipeline };