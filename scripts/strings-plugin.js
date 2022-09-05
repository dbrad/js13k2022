let plugin = {
  name: 'strings',
  setup(build)
  {
    let fs = require('fs');

    build.onLoad({ filter: /\.strings$/ }, async (args) =>
    {
      let text = await fs.promises.readFile(args.path, 'utf8');
      text = text.split("\n").join(";");
      return {
        contents: text,
        loader: "text",
      };
    });
  },
};

module.exports.stringsPlugin = plugin;