
import { MathConcept } from './math-concept.js'

/**
 * The Connection class is a thin API to make it easy to access connection data
 * stored in {@link MathConcept MathConcept} instances.  Specifically, the
 * construction and destruction of Connection objects has nothing to do with the
 * actual connections that exist among nodes in a {@link MathConcept MathConcept}
 * hierarchy, but rather these objects are created for convenience in accessing
 * and modifying those connections.
 * 
 * Specifically, the data for a connection between two MathConcepts is stored as
 * follows.  Assume we have MathConcepts X and Y with IDs idX and idY,
 * respectively, and a connection from X to Y that has ID C and associated data
 * D (which is an arbitrary Map stored as JSON).  This information is stored by
 * the following convention.
 * 
 *  * MathConcept X will have an attribute with key "_conn target C" and value
 *    idY.
 *  * MathConcept Y will have an attribute with key "_conn source C" and value
 *    idX.
 *  * MathConcept X will have an attribute with key "_conn data C" and value D.
 * 
 * In each of the above examples, the literal value C is not in the attribute
 * key, but rather the ID of the connection we're referring to as C.
 * 
 * While it would be possible to create, edit, and/or remove such data with just
 * the attribute getters and setters on {@link MathConcept MathConcept} instances,
 * this would be very inconvenient.  It will produce cleaner code if we treat
 * connections as first-class citizens by creating this class.  But its
 * instances merely hide the details of manipulating the data as described
 * above; they do not store their own data.  In particular:
 * 
 *  * We might have multiple instances of the Connection class all in existence
 *    at once, all referring to the exact same connection.  This does not make
 *    multiple copies of the connection; it merely gives us multiple ways to
 *    refer to it.
 *  * We might have no instances of the Connection class in existence for some
 *    particular connection.  This does not make the connection go away; it
 *    merely means we don't currently have objects that refer to it.
 */
export class Connection {

    /**
     * Each Connection should have a globally unique ID, and there should be a
     * dictionary of such IDs that give us a way to create a Connection instance
     * with that ID.
     * 
     * This Map stores the association of Connection IDs (keys) with MathConcept
     * instances (values), such that the MathConcept `IDs[x]` is the source of the
     * Connection with ID `x`.
     * 
     * This data structure should not be accessed by clients; it is private to
     * this class.  Use {@link Connection.withID withID()} instead.
     * 
     * @see {@link Connection.withID withID()}
     */
    static IDs = new Map

    /**
     * Create a Connection instance representing the connection with the given
     * ID.  Keep in mind that connections among MathConcepts are stored as data
     * within those MathConcepts, and this class is merely a convenient API for
     * manipulating that data.  So a connection exists independently of how many
     * (zero or more) Connection instances exist in memory.  If you want to
     * query or manipulate a connection, it is handy to get a Connection
     * instance for it, using this function.
     * 
     * @param {string} id - The globally unique ID of a connection among
     *   MathConcept instances
     * @return {Connection} A Connection instance representing the connection
     *   whose ID was given, or undefined if the given ID is not in the
     *   {@link Connection.IDs IDs} mapping
     */
    static withID ( id ) {
        return Connection.IDs.has( id ) ? new Connection( id ) : undefined
    }

    /**
     * This function constructs a new instance, and in that sense behaves very
     * much like {@link Connection.withID withID()}, but that function is to be
     * preferred over this one for two reasons.
     * 
     *  1. This function always returns a Connection instance, since it is the
     *     constructor, even if the parameter passed is not the ID of any
     *     existing Connection.  The resulting Connection instance will not be
     *     of any use to the client.
     *  2. Calling a constructor gives the illusion that the connection object
     *     is forming a connection between two {@link MathConcept MathConcept}s,
     *     while the {@link Connection.withID withID()} function suggests the
     *     truth more accurately, that we are simply getting ahold of an
     *     already-existing connection.  To form a new connection between two
     *     MathConcepts, use the {@link Connection.create create()} function
     *     instead.
     * 
     * @param {string} id - The globally unique ID of a connection among
     *   MathConcept instances
     * @see {@link Connection.withID withID()}
     * @see {@link Connection.create create()}
     */
    constructor ( id ) { this.id = id }

    /**
     * Create a new connection between two {@link MathConcept MathConcept}
     * instances.  This writes data into the attributes of those two instances,
     * data representing the connection, and then returns a Connection instance
     * that gives convenient access to that data.
     * 
     * @param {string} connectionID - The ID to be used for the newly formed
     *   connection.  This must not already exist in the
     *   {@link Connection.IDs IDs} mapping; if it does, this function takes no
     *   action.
     * @param {string} sourceID - The ID of the MathConcept that should be the
     *   source of the new connection.  If no MathConcept has this ID, this
     *   function takes no action.
     * @param {string} targetID - The ID of the MathConcept that should be the
     *   target of the new connection.  If no MathConcept has this ID, this
     *   function takes no action.
     * @param {*} [data] - Optional data to be assigned to the newly formed
     *   connection.  This parameter will be passed directly to the
     *   {@link Connection#attr attr()} function; see its documentation for the
     *   acceptable types and their meanings.
     * @return {Connection} A Connection instance for the newly created
     *   connection between the source and target.  This return value can be
     *   safely ignored, because the connection data is stored in the source and
     *   target MathConcepts, and is not dependent on the Connection object
     *   itself.  But this return value will be false if any step in the
     *   process fails, including if the connection ID is already in use or the
     *   source or target IDs are invalid.
     */
    static create ( connectionID, sourceID, targetID, data = null ) {
        if ( Connection.IDs.has( connectionID ) ) return false
        const source = MathConcept.instanceWithID( sourceID )
        if ( !source ) return false
        const target = MathConcept.instanceWithID( targetID )
        if ( !target ) return false
        source.setAttribute( `_conn target ${connectionID}`, targetID )
        target.setAttribute( `_conn source ${connectionID}`, sourceID )
        Connection.IDs.set( connectionID, source )
        const result = new Connection( connectionID )
        if ( data ) result.attr( data )
        return result
    }

    /**
     * Get the source {@link MathConcept MathConcept} for this connection.  This is
     * taken directly from the {@link Connection.IDs IDs} mapping.
     * 
     * @return {MathConcept} The source {@link MathConcept MathConcept}
     * @see {@link Connection#target target()}
     */
    source () { return Connection.IDs.get( this.id ) }

    /**
     * Get the target {@link MathConcept MathConcept} for this connection.
     * 
     * @return {MathConcept} The target {@link MathConcept MathConcept}
     * @see {@link Connection#source source()}
     */
    target () {
        const source = this.source()
        if ( !source ) return undefined
        const targetID = source.getAttribute( `_conn target ${this.id}` )
        if ( !targetID ) return undefined
        return MathConcept.instanceWithID( targetID )
    }

    /**
     * Get the JSON data associated with this connection.  Such data is stored
     * in the source {@link MathConcept MathConcept}, as documented in the
     * conventions described for {@link Connection this class}.
     * 
     * @private
     * @return {Object} The JSON data stored in the connection data attribute
     *   of the source {@link MathConcept MathConcept}, as long as it is an object.
     *   If it is not, this function returns a new, empty object instead, to
     *   guarantee that its return value is an object.  The return value will be
     *   undefined only if this object has no
     *   {@link Connection#source source()}.
     */
    _getData () {
        const source = this.source()
        if ( !source ) return undefined
        const result = source.getAttribute( `_conn data ${this.id}` )
        return result instanceof Object ? result : { }
    }

    /**
     * Set the JSON data associated with this connection.  Such data is stored
     * in the source {@link MathConcept MathConcept}, as documented in the
     * conventions described for {@link Connection this class}.
     * 
     * @private
     * @param {Object} json - A JavaScript object amenable to JSON encoding,
     *   holding the key-value pairs that are to be the data associated with
     *   this connection.
     * @return {boolean} True if and only if it succeeded in writing the data
     *   into the source {@link MathConcept MathConcept}.  This fails only if this
     *   object has no {@link Connection#source source()}.
     */
    _setData ( json ) {
        const source = this.source()
        if ( !source ) return false
        source.setAttribute( `_conn data ${this.id}`, json )
        return true
    }

    /**
     * This function is equivalent to zero or more calls to the
     * {@link Connection#setAttribute setAttribute()} function in immediate
     * succession, except that they are combined into a single modification of
     * the source MathConcept, to minimize the number of events generated.
     * 
     * @param {*} attributes - If this is an array, it is treated as an array of
     *   key-value pairs, and we use each such pair to update the data for this
     *   connection.  If this is a Map, then all of its key-value pairs are used
     *   instead, in the same way.  If this is any other kind of JavaScript
     *   object, then all of its keys and values are used instead, in the same
     *   way.
     * @return {boolean} True if and only if it succeeded in writing the data
     *   into the source {@link MathConcept MathConcept}.  This fails only if this
     *   object has no {@link Connection#source source()}.
     * @see {@link Connection#setAttribute setAttribute()}
     */
    attr ( attributes = [ ] ) {
        const newData = JSON.copy( this._getData() )
        if ( attributes instanceof Array ) {
            for ( const [ key, value ] of attributes ) {
                newData[key] = value
            }
        } else if ( attributes instanceof Map ) {
            for ( const [ key, value ] of attributes ) {
                newData[key] = value
            }
        } else if ( attributes instanceof Object ) {
            for ( const key of Object.keys( attributes ) ) {
                newData[key] = attributes[key]
            }
        }
        return this._setData( newData )
    }

    /**
     * Look up a value in the data associated with this connection.  The data
     * for a connection is a set of key-value pairs, stored in the source
     * {@link MathConcept MathConcept} for the connection, as described in the
     * conventions documented at the top of {@link Connection this class}.
     * This function looks up one value in that set of key-value pairs, given a
     * key.
     * 
     * @param {string} key - The key for the attribute to look up
     * @return {*} The value corresponding to the given key
     * @see {@link Connection#setAttribute setAttribute()}
     * @see {@link Connection#getAttributeKeys getAttributeKeys()}
     */
    getAttribute ( key ) {
        const data = this._getData()
        return data ? data[key] : undefined
    }

    /**
     * Store a value in the data associated with this connection.  The data
     * for a connection is a set of key-value pairs, stored in the source
     * {@link MathConcept MathConcept} for the connection, as described in the
     * conventions documented at the top of {@link Connection this class}.
     * This function adds or overwrites a pair in that set, given the new key
     * and value to use.  This therefore generates one
     * {@link MathConcept#willBeChanged willBeChanged} event and one
     * {@link MathConcept#wasChanged wasChanged} event in the source
     * {@link MathConcept MathConcept}.
     * 
     * @param {string} key - The key for the attribute to add or change
     * @param {*} value - The new value to associate with the key.  This should
     *   be data that is amenable to JSON encoding.
     * @return {boolean} True if and only if it succeeded in writing the data
     *   into the source {@link MathConcept MathConcept}.  This fails only if this
     *   object has no {@link Connection#source source()}.
     * @see {@link Connection#getAttribute getAttribute()}
     * @see {@link Connection#getAttributeKeys getAttributeKeys()}
     * @see {@link Connection#attr attr()}
     */
    setAttribute ( key, value ) {
        const newData = JSON.copy( this._getData() )
        newData[key] = value
        return this._setData( newData )
    }

    /**
     * The list of keys for all attributes of this connection.  The data for a
     * connection is a set of key-value pairs, stored in the source
     * {@link MathConcept MathConcept} for the connection, as described in the
     * conventions documented at the top of {@link Connection this class}.
     * This function looks up all the keys in that data and returns them.
     * 
     * @return {string[]} A list of strings, each one a key.  If this Connection
     *   instance has an invalid ID or any other misconfiguration, this result
     *   will be undefined.
     * @see {@link Connection#getAttribute getAttribute()}
     * @see {@link Connection#setAttribute setAttribute()}
     */
    getAttributeKeys () {
        const data = this._getData()
        return data ? Object.keys( data ) : undefined
    }

    /**
     * Check whether a key exists in the data associated with this connection.
     * The data for a connection is a set of key-value pairs, stored in the
     * source {@link MathConcept MathConcept} for the connection, as described in
     * the conventions documented at the top of {@link Connection this class}.
     * This function looks up a key and returns whether or not that key is
     * present in the data.
     * 
     * @param {string} key - The key to look up
     * @return {boolean} True if the key exists in the data, false if it does
     *   not or if there is any other problem with the lookup (such as this
     *   instance's ID being invalid)
     * @see {@link Connection#setAttribute setAttribute()}
     * @see {@link Connection#getAttribute getAttribute()}
     */
    hasAttribute ( key ) { return this._getData().hasOwnProperty( key ) }

    /**
     * Remove zero or more key-value pairs from the data associated with this
     * connection.  The data for a connection is a set of key-value pairs,
     * stored in the source {@link MathConcept MathConcept} for the connection, as
     * described in the conventions documented at the top of
     * {@link Connection this class}.  This function removes zero or more pairs
     * from that set, based on the list of keys it is given.  It makes only one
     * call to the {@link MathConcept#setAttribute setAttribute()} function in the
     * source {@link MathConcept MathConcept}, therefore generating only one
     * {@link MathConcept#willBeChanged willBeChanged} event and one
     * {@link MathConcept#wasChanged wasChanged} event in that
     * {@link MathConcept MathConcept}.
     * 
     * @param {string[]} keys - The keys to remove
     * @return {boolean} True if and only if it succeeded in altering the data
     *   in the source {@link MathConcept MathConcept}.  This fails only if this
     *   object has no {@link Connection#source source()}.
     * @see {@link Connection#setAttribute setAttribute()}
     * @see {@link Connection#getAttributeKeys getAttributeKeys()}
     */
    clearAttributes ( ...keys ) {
        const newData = JSON.copy( this._getData() )
        for ( const key of keys ) delete newData[key]
        return this._setData( newData )
    }

    /**
     * Delete a new connection between two {@link MathConcept MathConcept}
     * instances.  This deletes data from the attributes of those two instances,
     * data representing the connection, and thus generates one
     * {@link MathConcept#willBeChanged willBeChanged} event and one
     * {@link MathConcept#wasChanged wasChanged} event in each.  It also removes
     * this Connection's ID from {@link Connection.IDs the global mapping}.
     * 
     * @return {boolean} True if and only if it succeeded in deleting the data
     *   in the source and target {@link MathConcept MathConcept}s.  This fails only
     *   if this object has no {@link Connection#source source()} or no
     *   {@link Connection#target target()}.
     */
    remove () {
        const source = this.source()
        const target = this.target()
        if ( source )
            source.clearAttributes( `_conn target ${this.id}`,
                                    `_conn data ${this.id}` )
        if ( target )
            target.clearAttributes( `_conn source ${this.id}` )
        Connection.IDs.delete( this.id )
        return !!source && !!target
    }

    /**
     * When replacing a MathConcept in a hierarchy with another, we often want to
     * transfer all connections that went into or out of the old MathConcept to
     * its replacement instead.  This function performs that task.
     * 
     * @param {MathConcept} giver - The MathConcept that will lose its connections
     * @param {MathConcept} receiver - The MathConcept that will gain them
     * @return {boolean} Whether the operation succeeds, which happens as long
     *   as the receiver has a tracked ID and all relevant connections can be
     *   successfully removed from one place and recreated in another
     * @see {@link MathConcept#transferConnectionsTo transferConnectionsTo()}
     */
    static transferConnections ( giver, receiver ) {
        if ( !receiver.idIsTracked() ) return false
        for ( const connection of giver.getConnections() ) {
            // find connection source; replace giver -> receiver if needed
            let source = connection.source()
            if ( !source ) continue
            if ( source == giver ) source = receiver
            // find connection target; replace giver -> receiver if needed
            let target = connection.target()
            if ( !target ) continue
            if ( target == giver ) target = receiver
            // find connection data; if there is none, make it null
            let data = connection._getData()
            if ( Object.keys( data ).length == 0 ) data = null
            // delete the old and add the new
            if ( !connection.remove() ) return false
            if ( !Connection.create( connection.id, source.ID(),
                                     target.ID(), data ) ) return false
        }
        return true
    }

    /**
     * When a MathConcept is undergoing a change of ID, if it is part of any
     * connection, that connection will need to update how it is stored in the
     * attributes of either the source or target, to stay consistent with the
     * MathConcept's change of ID.
     * 
     * This function can be called when a MathConcept's ID changes, and if that
     * MathConcept exists on either end of this connection, it will update the
     * data on the other end to stay in sync with the ID change.
     * 
     * Clients should never need to call this; it is for use exclusively by the
     * {@link MathConcept MathConcept} class.
     * 
     * @param {string} oldID - The old ID of the changing MathConcept
     * @param {string} newID - The new ID of the changing MathConcept
     * @see {@link Connection#changeTargetID changeTargetID()}
     * @see {@link MathConcept#changeID changeID()}
     */
    handleIDChange ( oldID, newID ) {
        const source = this.source()
        const target = this.target()
        if ( !source || !target ) return
        if ( source.ID() == oldID )
            target.setAttribute( `_conn source ${this.id}`, newID )
        if ( target.ID() == oldID )
            source.setAttribute( `_conn target ${this.id}`, newID )
    }

}
