import React                from 'react';
import List                 from 'material-ui/List/List';
import ListItem             from 'material-ui/List/ListItem';


export default function (props) {
  return (
    <List>
      { props.events.map((e, i) =>
        <ListItem key={i} disabled={true}
          primaryText={`${e.event} at block ${e.blockNumber}`}
          secondaryText={JSON.stringify(e.args)}
        />
      )}
    </List>
  );
}
