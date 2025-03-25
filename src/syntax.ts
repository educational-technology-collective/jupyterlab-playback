import { NotebookPanel } from '@jupyterlab/notebook';

export const checkSyntax = async (notebookPanel: NotebookPanel) => {
  const messages: string[] = [];
  const nbaudiobase = [];
  const nbmap = [];
  let audioIndex = 0;
  let isValid = true;

  const cells = notebookPanel.model?.cells;
  if (cells) {
    for (let celli = 0; celli < cells?.length; celli++) {
      const cellMap: any = [];
      const cell = cells.get(celli);
      if (cell.type === 'code') {
        const source = cell.sharedModel.source.split('\n');
        const baseMap = cell.getMetadata('map');
        console.log(source, baseMap);

        if (source.length !== baseMap.length) {
          messages.push(
            `[Warning] <Cell ${celli}>: Line mismatch between code and metadata editors. Review before proceeding, or blank lines will be added for consistency.`
          );

          if (source.length > baseMap.length) {
            while (source.length > baseMap.length) {
              baseMap.push({ command: [] });
            }
          }

          if (source.length < baseMap.length) {
            while (source.length < baseMap.length) {
              source.push('');
            }
          }
        }

        let audiobase: any = [];
        source.forEach((line, linei) => {
          const commandList: string[] = baseMap[linei]['command'];
          const lineMap: any = {
            command: commandList,
            text: line
          };
          if (commandList.includes('AUDIO')) {
            if (line.startsWith('#')) {
              audiobase.push(line.slice(2).trim());
            } else {
              const err = `[Error] <Cell ${celli}, Line ${linei} >: Bad syntax for AUDIO command, line should start with #`;
              isValid = false;
              console.error(err);
              messages.push(err);
            }
            lineMap['audio_index'] = audioIndex;
          } else if (
            commandList.some(command => command.includes('AUDIOALT'))
          ) {
            const altText = commandList
              .filter(command => command.includes('AUDIOALT'))
              [-1].split('|')[-1];

            if (!altText || altText === 'AUDIOALT') {
              const err = `[Error] <Cell ${celli}, Line ${linei} >: Bad syntax for AUDIOALT command, the command should be followed by | <alt_text>: ${altText}`;
              isValid = false;
              console.error(err);
              messages.push(err);
            } else {
              audiobase.push(altText);
            }
            lineMap['audio_index'] = audioIndex;
          } else if (
            !commandList.includes('AUDIO') &&
            !commandList.some(command => command.includes('AUDIOALT')) &&
            audiobase.length > 0
          ) {
            nbaudiobase.push(audiobase.join(' '));
            audioIndex++;
            audiobase = [];
          }
          cellMap.push(lineMap);
        });
        if (audiobase.length != 0) {
          nbaudiobase.push(audiobase);
          audioIndex += 1;
        }
      }
      nbmap.push(cellMap);
    }
  }
  return { isValid, message: messages.join('\n'), nbaudiobase, nbmap };
};
