let log = (...data: any[]) =>
{
  if (DEBUG)
    console.log(...data);
};

export default log;